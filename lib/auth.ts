import { after } from "next/server"
import { betterAuth } from "better-auth"
import {
  APIError,
  createAuthMiddleware,
  getSessionFromCtx,
} from "better-auth/api"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { nextCookies } from "better-auth/next-js"
import { admin, organization } from "better-auth/plugins"

import { purgeUserData } from "@/lib/account"
import {
  describeDeactivated,
  describePasswordReset,
  describeReactivated,
  LOG_ACTIONS,
} from "@/lib/admin-log"
import { actorNameFor, recordAdminLog } from "@/lib/admin-log-store"
import { isAdminRole } from "@/lib/admin"
import { getAppSettings } from "@/lib/app-settings-store"
import { configuredSocialProviders } from "@/lib/auth-providers"
import { db } from "@/lib/db"
import {
  sendChangeEmailVerification,
  sendPasswordResetEmail,
  sendVerificationEmail,
} from "@/lib/email"
import { siteConfig } from "@/lib/site-config"

const isProduction = process.env.NODE_ENV === "production"

/** Extra origins allowed to drive auth, as a comma-separated env var. */
const trustedOrigins =
  process.env.BETTER_AUTH_TRUSTED_ORIGINS?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean) ?? []

/**
 * User ids that are admins regardless of the role on their row — the way the
 * first admin exists at all, since promoting someone requires an admin.
 *
 * Exported because the console's own guard has to honour the same list; the
 * plugin only applies it to Better Auth's endpoints.
 */
export const bootstrapAdminIds =
  process.env.ADMIN_USER_IDS?.split(",")
    .map((id) => id.trim())
    .filter(Boolean) ?? []

export const auth = betterAuth({
  appName: siteConfig.name,
  database: prismaAdapter(db, { provider: "postgresql" }),

  // `baseURL`/`secret` fall back to BETTER_AUTH_URL / BETTER_AUTH_SECRET.
  trustedOrigins,

  emailAndPassword: {
    enabled: true,
    // NIST SP 800-63B: an 8-character floor, and no low maximum that would
    // rule out passphrases or a password manager's output.
    minPasswordLength: 8,
    maxPasswordLength: 128,
    // Flip to `true` once you're sending from a verified domain — it blocks
    // sign-in until the address is confirmed.
    requireEmailVerification: false,
    resetPasswordTokenExpiresIn: 60 * 60,
    // A reset is how you recover a *stolen* account, so drop every other
    // session the attacker may be holding.
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) => {
      await sendPasswordResetEmail(user.email, url)
    },
  },

  hooks: {
    /**
     * The activity log's ear on Better Auth's own endpoints.
     *
     * Deactivating an account and sending a password reset both happen through
     * Better Auth rather than through routes of ours, so this is where those
     * two events are heard. Running *after* the endpoint means only what
     * actually succeeded is recorded.
     *
     * Only admin activity is logged: somebody resetting their own password from
     * the sign-in dialog is not console activity, and an audit log padded with
     * it is a worse audit log.
     */
    after: createAuthMiddleware(async (ctx) => {
      const logged = new Set([
        "/admin/ban-user",
        "/admin/unban-user",
        "/request-password-reset",
      ])

      if (!logged.has(ctx.path)) return

      const session = ctx.context.session ?? (await getSessionFromCtx(ctx))
      const actor = session?.user

      if (!actor || !isAdminRole((actor as { role?: string }).role)) return

      const actorName = actor.name || actor.email || null
      const body = (ctx.body ?? {}) as { userId?: string; email?: string }

      if (ctx.path === "/request-password-reset") {
        if (!body.email) return

        await recordAdminLog({
          action: LOG_ACTIONS.passwordResetSent,
          description: describePasswordReset(body.email),
          actorId: actor.id,
          actorName,
        })

        return
      }

      if (!body.userId) return

      const banned = ctx.path === "/admin/ban-user"
      const subject = (await actorNameFor(body.userId)) ?? "an account"

      await recordAdminLog({
        action: banned
          ? LOG_ACTIONS.userDeactivated
          : LOG_ACTIONS.userReactivated,
        description: banned
          ? describeDeactivated(subject)
          : describeReactivated(subject),
        actorId: actor.id,
        actorName,
        targetId: body.userId,
      })
    }),
  },

  databaseHooks: {
    user: {
      create: {
        /**
         * The "Allow new sign-ups" switch, enforced where every route that can
         * create a user has to pass — email sign-up and the OAuth callback
         * alike, rather than one guard per entry point.
         *
         * Deny by default when registration is closed: the admin console's own
         * create-user endpoint is the single exception, because that is an
         * admin deciding to add someone, not the public letting itself in.
         */
        before: async (_user, context) => {
          const { allowSignUps } = await getAppSettings()

          if (allowSignUps || context?.path === "/admin/create-user") return

          throw new APIError("FORBIDDEN", {
            message: "New sign-ups are closed right now.",
          })
        },
      },
    },
  },

  user: {
    deleteUser: {
      // Settings → Danger zone. Better Auth wants either the account's
      // password or a session minted inside `freshAge`; the dialog asks for
      // the password whenever there is one, so a stale tab can't delete an
      // account on its own.
      enabled: true,
      // Chats, documents and avatars aren't Better Auth's, so nothing
      // cascades to them — they go here, before the account they're scoped by
      // disappears.
      beforeDelete: async (user) => {
        await purgeUserData(user.id)
      },
    },

    changeEmail: {
      enabled: true,
      // No `sendChangeEmailConfirmation` on purpose. Configuring it turns the
      // change into two hops — approve at the old address, then verify at the
      // new one. Leaving it off drops Better Auth into the single-hop branch:
      // the link goes straight to the new address, and opening it writes the
      // new email and refreshes the session.
    },
  },

  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    expiresIn: 60 * 60,
    sendVerificationEmail: async ({ user, url }) => {
      // This one callback covers both "confirm your address after sign-up" and
      // "confirm the address you're moving to". Better Auth passes the *new*
      // address on a change while the row still holds the old one, so that
      // mismatch is what tells the two apart — and it gives us the previous
      // address to name in the copy.
      const stored = await db.user.findUnique({
        where: { id: user.id },
        select: { email: true },
      })

      if (stored && stored.email !== user.email) {
        await sendChangeEmailVerification(user.email, stored.email, url)
        return
      }

      await sendVerificationEmail(user.email, url)
    },
  },

  // Only the providers whose credentials are present — see lib/auth-providers.
  socialProviders: configuredSocialProviders(),

  account: {
    encryptOAuthTokens: true,
    accountLinking: {
      enabled: true,
      // Both providers assert a verified email, so signing in with Google
      // after signing up with GitHub lands on the same account instead of
      // silently creating a duplicate.
      trustedProviders: ["google", "github"],
      // Copy the provider's name and picture onto the user when an account is
      // linked, so someone who signed up with a password gets a real avatar
      // the first time they continue with Google or GitHub. Email and
      // emailVerified are never touched, so a link can't rebind the account.
      updateUserInfoOnLink: true,
    },
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    freshAge: 60 * 60,
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5,
    },
  },

  rateLimit: {
    enabled: true,
    // Serverless instances don't share memory, so an in-memory counter would
    // reset on every cold start and let an attacker fan out across instances.
    storage: "database",
    window: 10,
    max: 100,
    // Paths are relative to basePath (/api/auth), not absolute.
    customRules: {
      "/sign-in/email": { window: 60, max: 5 },
      "/sign-up/email": { window: 60, max: 3 },
      "/request-password-reset": { window: 60, max: 3 },
      "/reset-password": { window: 60, max: 5 },
    },
  },

  advanced: {
    useSecureCookies: isProduction,
    ipAddress: {
      // Vercel and most proxies set these; needed for per-IP rate limiting.
      ipAddressHeaders: ["x-forwarded-for", "x-real-ip"],
    },
    backgroundTasks: {
      // Sending mail off the response path keeps reply timing constant, so it
      // can't be used to probe which addresses have accounts.
      handler: (promise) => after(promise),
    },
  },

  plugins: [
    // A workspace is an organization: every signed-in user creates one before
    // they reach the product, and the creator owns it. Invitations are not
    // wired up yet — add `sendInvitationEmail` here when they are.
    organization({
      organizationLimit: 5,
      membershipLimit: 100,
    }),

    // Staff access to the admin console at `/app/admin`. Nothing about it is
    // per-workspace: an admin operates the whole app, so this is `user.role`
    // rather than an organization role.
    //
    // The role is only ever set by another admin or by hand in the database —
    // sign-up can't ask for it (`input: false` on the plugin's own field), and
    // `defaultRole` makes every new account a plain user. `ADMIN_USER_IDS` is
    // the bootstrap for the first one, before there's an admin to promote them.
    admin({
      defaultRole: "user",
      adminRoles: ["admin"],
      adminUserIds: bootstrapAdminIds,
    }),

    // Must stay last — it writes cookies set during server actions.
    nextCookies(),
  ],
})

export type Session = typeof auth.$Infer.Session
export type SessionUser = Session["user"]

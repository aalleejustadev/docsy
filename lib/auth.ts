import { after } from "next/server"
import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { nextCookies } from "better-auth/next-js"
import { organization } from "better-auth/plugins"

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

  user: {
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

    // Must stay last — it writes cookies set during server actions.
    nextCookies(),
  ],
})

export type Session = typeof auth.$Infer.Session
export type SessionUser = Session["user"]

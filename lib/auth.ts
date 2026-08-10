import { after } from "next/server"
import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { nextCookies } from "better-auth/next-js"

import { configuredSocialProviders } from "@/lib/auth-providers"
import { db } from "@/lib/db"
import { sendPasswordResetEmail, sendVerificationEmail } from "@/lib/email"
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

  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    expiresIn: 60 * 60,
    sendVerificationEmail: async ({ user, url }) => {
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
    // Must stay last — it writes cookies set during server actions.
    nextCookies(),
  ],
})

export type Session = typeof auth.$Infer.Session
export type SessionUser = Session["user"]

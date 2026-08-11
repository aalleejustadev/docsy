import { createAuthClient } from "better-auth/react"
import { organizationClient } from "better-auth/client/plugins"

export const authClient = createAuthClient({
  // Same-origin in the browser; the env var only matters for non-browser use.
  baseURL: process.env.NEXT_PUBLIC_APP_URL,
  // Mirrors the server plugin list — see `lib/auth.ts`.
  plugins: [organizationClient()],
})

export const {
  signIn,
  signUp,
  signOut,
  useSession,
  getSession,
  requestPasswordReset,
  resetPassword,
  organization,
  useActiveOrganization,
  useListOrganizations,
} = authClient

// Inferred from the client, not from `lib/auth`, so client components never
// pull the server config (and its database import) into the browser bundle.
export type Session = typeof authClient.$Infer.Session
export type SessionUser = Session["user"]
export type Organization = typeof authClient.$Infer.Organization

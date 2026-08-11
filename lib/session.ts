import { cache } from "react"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { auth } from "@/lib/auth"
import { APP_ROOT } from "@/lib/dashboard-nav"

/**
 * The session for the current request. `cache` dedupes it, so a layout and the
 * page it wraps share one lookup instead of hitting the database twice.
 *
 * Server-only — client components use `useSession` from `lib/auth-client`.
 */
export const getServerSession = cache(async () => {
  return auth.api.getSession({ headers: await headers() })
})

/** Signed-in guard for `/app`. The proxy bounces most of these first. */
export async function requireSession() {
  const session = await getServerSession()

  if (!session) {
    redirect("/")
  }

  return session
}

/** Landing pages call this to hand signed-in visitors straight to the app. */
export async function redirectIfSignedIn() {
  const session = await getServerSession()

  if (session) {
    redirect(APP_ROOT)
  }
}

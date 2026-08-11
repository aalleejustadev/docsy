import { cache } from "react"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { auth } from "@/lib/auth"
import { APP_ROOT, ONBOARDING_ROUTE } from "@/lib/dashboard-nav"

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

/** Every organization the signed-in user belongs to, deduped per request. */
export const getOrganizations = cache(async () => {
  return auth.api.listOrganizations({ headers: await headers() })
})

/**
 * The workspace the user is working in. A signed-in user without one has not
 * finished onboarding, so there is nothing to show them but the form.
 */
export async function requireOrganization() {
  const session = await requireSession()
  const organizations = await getOrganizations()

  if (organizations.length === 0) {
    redirect(ONBOARDING_ROUTE)
  }

  const activeId = session.session.activeOrganizationId

  return (
    organizations.find((organization) => organization.id === activeId) ??
    organizations[0]
  )
}

/** The reverse guard: onboarding is pointless once a workspace exists. */
export async function redirectIfOnboarded() {
  await requireSession()
  const organizations = await getOrganizations()

  if (organizations.length > 0) {
    redirect(APP_ROOT)
  }
}

/** Landing pages call this to hand signed-in visitors straight to the app. */
export async function redirectIfSignedIn() {
  const session = await getServerSession()

  if (session) {
    redirect(APP_ROOT)
  }
}

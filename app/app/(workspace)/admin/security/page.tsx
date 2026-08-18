import type { Metadata } from "next"

import { getAppSettings } from "@/lib/app-settings-store"
import { requireAdmin } from "@/lib/session"
import { AdminSecuritySettings } from "@/components/admin/security/admin-security-settings"

export const metadata: Metadata = {
  title: "Security · Admin",
}

/**
 * `/app/admin/security` — the Security tab.
 *
 * Every switch here is read back by the code that enforces it: sign-ups by the
 * `user.create` hook in `lib/auth.ts`, maintenance mode by the `/app`
 * boundary, retention by `purgeExpiredChats`. Nothing on this page is a
 * preference the product then ignores.
 *
 * Guarded here as well as in the layout — layouts and pages render at the same
 * time, and the API behind the switches checks the role again.
 */
export default async function AdminSecurityPage() {
  await requireAdmin()

  const settings = await getAppSettings()

  return <AdminSecuritySettings settings={settings} />
}

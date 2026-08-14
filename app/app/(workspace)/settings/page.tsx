import type { Metadata } from "next"

import { requireOrganization, requireSession } from "@/lib/session"
import { AccountSettings } from "@/components/dashboard/settings/account-settings"

export const metadata: Metadata = {
  title: "Account settings",
}

/** `/app/settings` — the Account tab, and the default landing tab. */
export default async function SettingsPage() {
  const session = await requireSession()
  const organization = await requireOrganization()

  return (
    <AccountSettings
      user={session.user}
      workspace={{ id: organization.id, name: organization.name }}
    />
  )
}

import type { Metadata } from "next"
import { headers } from "next/headers"

import { auth } from "@/lib/auth"
import { getNavCounts } from "@/lib/chat-store"
import { requireOrganization } from "@/lib/session"
import { DangerZoneSettings } from "@/components/dashboard/settings/danger-zone-settings"

export const metadata: Metadata = {
  title: "Danger zone",
}

/** `/app/settings/danger-zone` — the Danger zone tab. */
export default async function DangerZoneSettingsPage() {
  const organization = await requireOrganization()

  const [counts, accounts] = await Promise.all([
    getNavCounts(organization.id),
    auth.api.listUserAccounts({ headers: await headers() }),
  ])

  return (
    <DangerZoneSettings
      counts={counts}
      // Someone who only ever continued with Google has no password to be
      // asked for, so the delete dialog can't ask for one.
      hasPassword={accounts.some(
        (account) => account.providerId === "credential"
      )}
    />
  )
}

import type { Metadata } from "next"

import { DangerZoneSettings } from "@/components/dashboard/settings/danger-zone-settings"

export const metadata: Metadata = {
  title: "Danger zone",
}

/** `/app/settings/danger-zone` — the Danger zone tab. */
export default function DangerZoneSettingsPage() {
  return <DangerZoneSettings />
}

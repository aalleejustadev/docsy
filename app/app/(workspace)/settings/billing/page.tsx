import type { Metadata } from "next"

import { BillingSettings } from "@/components/dashboard/settings/billing-settings"

export const metadata: Metadata = {
  title: "Billing",
}

/** `/app/settings/billing` — the Billing tab. */
export default function BillingSettingsPage() {
  return <BillingSettings />
}

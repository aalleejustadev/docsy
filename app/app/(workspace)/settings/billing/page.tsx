import type { Metadata } from "next"

import { reconcileCheckoutSession } from "@/lib/billing-store"
import { requireOrganization } from "@/lib/session"
import { BillingSettings } from "@/components/dashboard/settings/billing-settings"

export const metadata: Metadata = {
  title: "Billing",
}

/** `/app/settings/billing` — the Billing tab. */
export default async function BillingSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string; session_id?: string }>
}) {
  const { checkout, session_id: sessionId } = await searchParams

  // Stripe sends the customer back here the instant checkout completes, which
  // is usually before the webhook lands. Reconciling first means the plan is
  // already live on this render.
  //
  // This is not a way around the webhook: it asks Stripe what happened rather
  // than believing the redirect, refuses a session that isn't paid for, and
  // refuses one belonging to another workspace. Someone pasting a session id
  // into the URL gets nothing. The webhook then writes the same values again.
  if (checkout === "success" && sessionId) {
    const organization = await requireOrganization()

    try {
      await reconcileCheckoutSession(sessionId, organization.id)
    } catch (error) {
      // The webhook is the guarantee; this is only the fast path. If it fails,
      // the plan still lands a moment later.
      console.error("[billing] checkout reconcile failed", error)
    }
  }

  return <BillingSettings checkout={checkout} />
}

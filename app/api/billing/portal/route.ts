import { NextResponse } from "next/server"

import { requireApiContext } from "@/lib/api-session"
import { getSubscriptionRecord } from "@/lib/billing-store"
import { BILLING_ROUTE } from "@/lib/dashboard-nav"
import { appUrl, getStripe, isBillingConfigured } from "@/lib/stripe"

/**
 * Hands the workspace over to Stripe's Customer Portal.
 *
 * Changing plan, updating the card and cancelling all live there rather than in
 * our own forms: the portal already handles proration, dunning and receipts,
 * and every change it makes comes back through the same webhook as a checkout.
 */
export async function POST() {
  const guard = await requireApiContext()
  if (!guard.ok) return guard.response

  if (!isBillingConfigured()) {
    return NextResponse.json(
      { error: "Billing isn't configured on this deployment." },
      { status: 503 }
    )
  }

  const record = await getSubscriptionRecord(guard.context.organizationId)

  if (!record) {
    return NextResponse.json(
      { error: "This workspace has no billing history yet." },
      { status: 400 }
    )
  }

  const session = await getStripe().billingPortal.sessions.create({
    customer: record.stripeCustomerId,
    return_url: appUrl(BILLING_ROUTE),
  })

  return NextResponse.json({ url: session.url })
}

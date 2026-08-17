import { NextResponse } from "next/server"

import { requireApiContext } from "@/lib/api-session"
import { isPaidPlanId } from "@/lib/billing"
import { ensureStripeCustomer } from "@/lib/billing-store"
import { BILLING_ROUTE } from "@/lib/dashboard-nav"
import { getOrganizations, getServerSession } from "@/lib/session"
import {
  appUrl,
  getStripe,
  integrationIdentifier,
  isBillingConfigured,
  stripePriceId,
} from "@/lib/stripe"
import type { BillingPeriod } from "@/lib/pricing"

/**
 * Opens Stripe Checkout for a plan.
 *
 * Note what this route does *not* do: it never writes a plan. It hands back a
 * URL, and the workspace stays exactly where it was until Stripe reports a paid
 * subscription to the webhook. Someone calling this endpoint by hand gets a
 * checkout page, not an upgrade.
 */
export async function POST(request: Request) {
  const guard = await requireApiContext()
  if (!guard.ok) return guard.response

  if (!isBillingConfigured()) {
    return NextResponse.json(
      { error: "Billing isn't configured on this deployment." },
      { status: 503 }
    )
  }

  const body = (await request.json().catch(() => null)) as {
    plan?: string
    period?: string
  } | null

  const plan = body?.plan ?? ""
  const period = (body?.period ?? "monthly") as BillingPeriod

  if (!isPaidPlanId(plan)) {
    return NextResponse.json({ error: "Unknown plan." }, { status: 400 })
  }

  if (period !== "monthly" && period !== "annual") {
    return NextResponse.json(
      { error: "Unknown billing period." },
      { status: 400 }
    )
  }

  const price = stripePriceId(plan, period)

  if (!price) {
    return NextResponse.json(
      { error: `No Stripe price is configured for the ${plan} plan.` },
      { status: 503 }
    )
  }

  const session = await getServerSession()
  const organizations = await getOrganizations()
  const organization = organizations.find(
    (candidate) => candidate.id === guard.context.organizationId
  )

  if (!session || !organization) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 })
  }

  const customer = await ensureStripeCustomer({
    organizationId: organization.id,
    organizationName: organization.name,
    userId: session.user.id,
    email: session.user.email,
    name: session.user.name,
  })

  const checkout = await getStripe().checkout.sessions.create({
    mode: "subscription",
    customer,
    line_items: [{ price, quantity: 1 }],
    // No `payment_method_types`: leaving it off lets Stripe pick the methods
    // most likely to convert for each customer, configured from the Dashboard.
    allow_promotion_codes: true,
    // Both halves are read back on the way in — `client_reference_id` is what
    // the reconcile checks the session against, and the subscription metadata
    // is what tells the webhook which workspace to credit.
    client_reference_id: organization.id,
    subscription_data: {
      metadata: {
        organizationId: organization.id,
        organizationName: organization.name,
        userId: session.user.id,
      },
    },
    metadata: { organizationId: organization.id, planId: plan },
    integration_identifier: integrationIdentifier(),
    success_url: appUrl(
      `${BILLING_ROUTE}?checkout=success&session_id={CHECKOUT_SESSION_ID}`
    ),
    cancel_url: appUrl(`${BILLING_ROUTE}?checkout=cancelled`),
  })

  if (!checkout.url) {
    return NextResponse.json(
      { error: "Stripe didn't return a checkout URL." },
      { status: 502 }
    )
  }

  return NextResponse.json({ url: checkout.url })
}

import { cache } from "react"
import type Stripe from "stripe"

import {
  isEntitled,
  planQuestionLimit,
  type BillingCard,
  type BillingInvoice,
  type BillingView,
  type PlanId,
} from "@/lib/billing"
import { db } from "@/lib/db"
import { getStripe, isBillingConfigured, planForPrice } from "@/lib/stripe"

/**
 * Server-only. The workspace's subscription: what Postgres holds, and the
 * writes that keep it in step with Stripe.
 *
 * Four things write to the `subscription` table. Three take their values from
 * Stripe — the webhook handler, the reconcile that runs when someone lands back
 * from checkout, and `ensureStripeCustomer` (which writes a customer id and
 * nothing else). The fourth is `grantPlan`, which an admin reaches through the
 * console and which records itself as a grant rather than a payment.
 *
 * No *client request* can move a workspace onto a paid plan: the browser can
 * only ask Stripe for a checkout, or ask the admin API — which checks the
 * caller's role on the server before granting anything.
 */

/** How many invoices the Billing tab lists. */
const INVOICE_LIMIT = 5

/** The row, or null for a workspace that has never opened checkout. */
export const getSubscriptionRecord = cache(async (organizationId: string) => {
  return db.subscription.findUnique({ where: { organizationId } })
})

/**
 * The plan a workspace is actually entitled to — the single source of truth
 * for every limit in the product.
 *
 * A row alone isn't enough: `isEntitled` insists on a Stripe status that means
 * the money is there, so a cancelled or failed subscription falls back to
 * `free` without anything having to remember to downgrade it.
 */
export const getWorkspacePlan = cache(
  async (organizationId: string): Promise<PlanId> => {
    const record = await getSubscriptionRecord(organizationId)

    if (!record || !isEntitled(record.status)) return "free"

    return record.planId as PlanId
  }
)

/** The month's question allowance for this workspace's plan. */
export async function getWorkspaceQuestionLimit(organizationId: string) {
  return planQuestionLimit(await getWorkspacePlan(organizationId))
}

/**
 * The Stripe customer for a workspace, created on first use.
 *
 * Created *before* checkout on purpose: an abandoned checkout then leaves a
 * customer to reuse, so a second attempt doesn't strand a duplicate. The row it
 * writes carries `planId: "free"` — a customer is somewhere to send an invoice,
 * not an entitlement.
 */
export async function ensureStripeCustomer({
  organizationId,
  organizationName,
  userId,
  email,
  name,
}: {
  organizationId: string
  organizationName: string
  userId: string
  email: string
  name?: string | null
}) {
  const existing = await db.subscription.findUnique({
    where: { organizationId },
    select: { stripeCustomerId: true },
  })

  // A row without a customer is a workspace an admin comped: it has an
  // entitlement but nobody to bill. Giving it a customer here is what lets a
  // comped workspace go and buy a real subscription later.
  if (existing?.stripeCustomerId) return existing.stripeCustomerId

  const customer = await getStripe().customers.create({
    email,
    name: name || organizationName,
    // Stamped on the customer as well as the subscription, so a subscription
    // created outside our checkout (in the Dashboard, say) can still be traced
    // back to a workspace.
    metadata: { organizationId, organizationName, userId },
  })

  const saved = await db.subscription.upsert({
    where: { organizationId },
    create: { organizationId, stripeCustomerId: customer.id, planId: "free" },
    // Only the customer id: an admin-granted plan keeps its entitlement while
    // they're at the checkout, and loses it only if Stripe replaces the row.
    update: { stripeCustomerId: customer.id },
  })

  return saved.stripeCustomerId!
}

/**
 * Comps a workspace onto a paid plan from the admin console.
 *
 * This is the one entitlement in the product that money didn't buy, so it is
 * recorded as exactly that: `source: "admin"` and the admin's own id, with no
 * Stripe subscription behind it. `isEntitled` treats it like any other active
 * plan — the difference is provenance, and the Billing tab says so rather than
 * showing a price nobody is paying.
 *
 * A later checkout overwrites the row through `syncSubscription`, which resets
 * `source` to `stripe`, so a workspace that starts paying stops being comped.
 */
export async function grantPlan({
  organizationId,
  planId,
  grantedByUserId,
}: {
  organizationId: string
  planId: PlanId
  grantedByUserId: string
}) {
  const data = {
    planId,
    // Deliberately borrows Stripe's vocabulary: everything downstream already
    // asks `isEntitled(status)`, and a grant is an active entitlement.
    status: "active",
    source: "admin",
    grantedByUserId,
    // A comp doesn't expire and isn't billed, so there's no period to show.
    interval: null,
    priceId: null,
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
  }

  return db.subscription.upsert({
    where: { organizationId },
    create: { organizationId, ...data },
    update: data,
  })
}

/** The end of the paid period. Stripe moved this onto the item in Basil. */
function currentPeriodEnd(subscription: Stripe.Subscription) {
  const seconds = subscription.items.data[0]?.current_period_end

  return seconds ? new Date(seconds * 1000) : null
}

function cardFrom(
  paymentMethod: string | Stripe.PaymentMethod | null | undefined
) {
  if (!paymentMethod || typeof paymentMethod === "string") return null

  const card = paymentMethod.card

  if (!card) return null

  return {
    brand: card.brand,
    last4: card.last4,
    expMonth: card.exp_month,
    expYear: card.exp_year,
  }
}

/**
 * Which workspace a Stripe subscription belongs to.
 *
 * The metadata we stamped at checkout is the first answer; the customer id is
 * the fallback, which is what catches a subscription started from the Stripe
 * Dashboard. Null means we've never heard of it — the webhook then ignores the
 * event rather than guessing.
 */
async function organizationForSubscription(subscription: Stripe.Subscription) {
  const fromMetadata = subscription.metadata?.organizationId

  if (fromMetadata) return fromMetadata

  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer.id

  const record = await db.subscription.findUnique({
    where: { stripeCustomerId: customerId },
    select: { organizationId: true },
  })

  return record?.organizationId ?? null
}

/**
 * Writes Stripe's version of a subscription into Postgres.
 *
 * The plan comes from the price Stripe billed, not from anything the browser
 * asked for, and the status comes straight across — so an `incomplete` checkout
 * lands here as `incomplete` and entitles nothing.
 */
export async function syncSubscription(subscription: Stripe.Subscription) {
  const organizationId = await organizationForSubscription(subscription)

  if (!organizationId) return null

  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer.id

  const priceId = subscription.items.data[0]?.price?.id ?? null
  const { planId, period } = planForPrice(priceId)
  const card = cardFrom(subscription.default_payment_method)

  const data = {
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscription.id,
    // Stripe is now the authority on this row, even if an admin comped it
    // before — money outranks a grant, and the grant's provenance would
    // otherwise keep the Billing tab claiming nobody is paying.
    source: "stripe",
    grantedByUserId: null,
    status: subscription.status,
    planId,
    priceId,
    interval: period,
    currentPeriodEnd: currentPeriodEnd(subscription),
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    // Keep the card we already had when this payload didn't expand one, rather
    // than blanking the payment-method row on an unrelated status change.
    ...(card && {
      cardBrand: card.brand,
      cardLast4: card.last4,
      cardExpMonth: card.expMonth,
      cardExpYear: card.expYear,
    }),
  }

  return db.subscription.upsert({
    where: { organizationId },
    create: { organizationId, ...data },
    update: data,
  })
}

/** Re-reads a subscription from Stripe — with the fields we store expanded. */
export async function syncSubscriptionById(subscriptionId: string) {
  const subscription = await getStripe().subscriptions.retrieve(
    subscriptionId,
    { expand: ["default_payment_method", "items.data.price"] }
  )

  return syncSubscription(subscription)
}

/**
 * The checkout-return path, for the seconds before the webhook lands.
 *
 * Not a shortcut around fulfillment: it asks Stripe what happened rather than
 * trusting the redirect, refuses a session that isn't paid for, and refuses one
 * that belongs to another workspace. The webhook does the same work, and
 * whichever arrives second simply overwrites with identical values.
 */
export async function reconcileCheckoutSession(
  sessionId: string,
  organizationId: string
) {
  if (!isBillingConfigured()) return null

  const session = await getStripe().checkout.sessions.retrieve(sessionId)

  // A session can complete while the payment is still pending — a delayed
  // payment method, a card in review. Nothing is granted until it isn't unpaid.
  if (session.payment_status === "unpaid") return null
  if (session.client_reference_id !== organizationId) return null
  if (!session.subscription) return null

  const subscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription.id

  return syncSubscriptionById(subscriptionId)
}

function formatAmount(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount / 100)
}

/** Stripe's invoice status in the words the badge uses. */
function invoiceStatus(invoice: Stripe.Invoice) {
  switch (invoice.status) {
    case "paid":
      return "Paid"
    case "open":
      return invoice.due_date && invoice.due_date * 1000 < Date.now()
        ? "Past due"
        : "Open"
    case "void":
      return "Void"
    case "uncollectible":
      return "Unpaid"
    default:
      return "Draft"
  }
}

async function listInvoices(customerId: string): Promise<BillingInvoice[]> {
  const invoices = await getStripe().invoices.list({
    customer: customerId,
    limit: INVOICE_LIMIT,
  })

  return (
    invoices.data
      // A draft invoice has no date to show and nothing to download yet.
      .filter((invoice) => invoice.status && invoice.status !== "draft")
      .map((invoice) => ({
        id: invoice.id ?? invoice.number ?? String(invoice.created),
        date: new Date(invoice.created * 1000).toISOString(),
        amount: formatAmount(
          invoice.status === "paid" ? invoice.amount_paid : invoice.amount_due,
          invoice.currency
        ),
        status: invoiceStatus(invoice),
        pdfUrl: invoice.invoice_pdf ?? invoice.hosted_invoice_url ?? null,
      }))
  )
}

/**
 * Everything the Billing tab renders.
 *
 * The plan is read through the same entitlement check the rest of the product
 * uses, so this page can't show "Pro" to a workspace that the chat composer is
 * treating as free. Stripe is called only for the invoice list — the plan, the
 * renewal date and the card all come from our own row.
 */
export async function getBillingView(
  organizationId: string
): Promise<BillingView> {
  const configured = isBillingConfigured()
  const record = await getSubscriptionRecord(organizationId)

  const entitled = isEntitled(record?.status)
  const card: BillingCard | null =
    record?.cardBrand && record.cardLast4
      ? {
          brand: record.cardBrand,
          last4: record.cardLast4,
          expires:
            record.cardExpMonth && record.cardExpYear
              ? `${String(record.cardExpMonth).padStart(2, "0")}/${String(
                  record.cardExpYear
                ).slice(-2)}`
              : null,
        }
      : null

  let invoices: BillingInvoice[] = []

  if (configured && record?.stripeCustomerId) {
    try {
      invoices = await listInvoices(record.stripeCustomerId)
    } catch (error) {
      // Stripe being unreachable shouldn't take the settings page down with
      // it — the rest of the tab is served from our own row.
      console.error("[billing] could not list invoices", error)
    }
  }

  return {
    planId: entitled ? (record!.planId as PlanId) : "free",
    status: record?.status ?? null,
    period: (record?.interval as BillingView["period"]) ?? null,
    currentPeriodEnd: record?.currentPeriodEnd?.toISOString() ?? null,
    cancelAtPeriodEnd: record?.cancelAtPeriodEnd ?? false,
    source: (record?.source as BillingView["source"]) ?? "stripe",
    card,
    invoices,
    configured,
    // The portal needs a Stripe customer, which a comped workspace hasn't got.
    hasCustomer: Boolean(record?.stripeCustomerId),
  }
}

import { PLANS, type BillingPeriod } from "@/lib/pricing"

/**
 * What a plan *is*, with no database and no Stripe in sight — safe to import
 * from a client component. The lookups that need either live in
 * `lib/billing-store.ts` (Postgres) and `lib/stripe.ts` (Stripe).
 */

export type PlanId = "free" | "pro" | "business"

/** The plans money can buy. A workspace is `free` until one of these is paid for. */
export const PAID_PLAN_IDS = ["pro", "business"] as const

export type PaidPlanId = (typeof PAID_PLAN_IDS)[number]

export function isPaidPlanId(value: string): value is PaidPlanId {
  return (PAID_PLAN_IDS as readonly string[]).includes(value)
}

/**
 * The Stripe subscription statuses that actually entitle a workspace to its
 * plan.
 *
 * Deliberately short. `incomplete` is a checkout whose payment never
 * confirmed, `past_due` is a renewal that failed, `canceled` speaks for
 * itself — all of them read as `free` here, so the only way to hold a paid
 * plan is for Stripe to be holding the money for it.
 */
const ENTITLED_STATUSES = new Set(["active", "trialing"])

export function isEntitled(status: string | null | undefined) {
  return (
    status !== null && status !== undefined && ENTITLED_STATUSES.has(status)
  )
}

/**
 * Questions per calendar month, by plan — the one limit that moves between
 * plans, as the pricing page promises. `Infinity` is a real answer here: it
 * flows through `questionAllowance` untouched and formats as "Unlimited".
 */
export const PLAN_QUESTION_LIMITS: Record<PlanId, number> = {
  free: 5,
  pro: 50,
  business: Number.POSITIVE_INFINITY,
}

export function planQuestionLimit(planId: PlanId) {
  return PLAN_QUESTION_LIMITS[planId]
}

/** The marketing catalog entry behind a plan — its name, price and features. */
export function planCatalogEntry(planId: PlanId) {
  return PLANS.find((plan) => plan.id === planId) ?? PLANS[0]
}

/** "Free", "Pro", "Business". */
export function planName(planId: PlanId) {
  return planCatalogEntry(planId).name
}

/** "Free plan", "Pro plan" — the label under the user's name in the sidebar. */
export function planLabel(planId: PlanId) {
  return `${planName(planId)} plan`
}

/** The plan a workspace can move up to, or null at the top of the ladder. */
export function nextPlanUp(planId: PlanId): PaidPlanId | null {
  if (planId === "free") return "pro"
  if (planId === "pro") return "business"

  return null
}

export type BillingCard = {
  /** "visa", "amex" — Stripe's own brand id, uppercased for display. */
  brand: string
  last4: string
  /** "09/28", or null when Stripe didn't return an expiry. */
  expires: string | null
}

export type BillingInvoice = {
  id: string
  /** ISO timestamp of the invoice date. */
  date: string
  /** Already formatted with its currency — "$19.00". */
  amount: string
  /** "Paid", "Open", "Past due" — title case, straight into the badge. */
  status: string
  /** Stripe-hosted PDF. Null while an invoice is still a draft. */
  pdfUrl: string | null
}

/** Everything the Billing tab renders, resolved server-side. */
export type BillingView = {
  planId: PlanId
  /** Stripe's status, or null on a workspace that has never subscribed. */
  status: string | null
  period: BillingPeriod | null
  /** ISO timestamp — the renewal date, or when access lapses if cancelling. */
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean
  card: BillingCard | null
  invoices: BillingInvoice[]
  /** False when the Stripe env vars are missing — the tab says so instead of
   *  offering buttons that can only fail. */
  configured: boolean
  /** True once a Stripe customer exists, which is what the portal needs. */
  hasCustomer: boolean
}

/** "Aug 20, 2026". */
export function formatBillingDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

/**
 * The line under the plan name: what it costs, and what happens next.
 *
 * Reads the price off the marketing catalog rather than the Stripe amount, so
 * the number here and the number on the pricing page can't drift apart.
 */
export function planTerms(view: BillingView) {
  const plan = planCatalogEntry(view.planId)

  if (view.planId === "free") {
    // Says nothing about a card: a workspace that cancelled still has one on
    // file, and the payment-method card below is where that belongs anyway.
    return `${PLAN_QUESTION_LIMITS.free} questions per month · upgrade any time`
  }

  const period = view.period ?? "monthly"
  const price = `$${plan.price[period]} / month`
  const billed = period === "annual" ? ", billed annually" : ""

  if (!view.currentPeriodEnd) return `${price}${billed}`

  const date = formatBillingDate(view.currentPeriodEnd)

  return view.cancelAtPeriodEnd
    ? `${price}${billed} · ends ${date}`
    : `${price}${billed} · renews ${date}`
}

/**
 * A paid plan whose money stopped arriving. The subscription still exists at
 * Stripe, but the workspace has already dropped to free limits — so the tab
 * has to say why rather than quietly showing "Free".
 */
export function billingWarning(view: BillingView) {
  if (isEntitled(view.status)) return null

  switch (view.status) {
    case "past_due":
    case "unpaid":
      return "Your last payment failed, so this workspace is back on Free limits. Update your payment method to restore your plan."
    case "incomplete":
      return "Your payment hasn't finished confirming yet. Your plan starts as soon as it does."
    case "incomplete_expired":
      return "That checkout expired before the payment confirmed, so no plan was started."
    case "canceled":
      return "Your subscription was cancelled. You're on Free limits now."
    default:
      return null
  }
}

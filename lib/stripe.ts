import Stripe from "stripe"

import { isPaidPlanId, type PaidPlanId, type PlanId } from "@/lib/billing"
import type { BillingPeriod } from "@/lib/pricing"

/**
 * Server-only. Everything that talks to Stripe, and the env vars it needs.
 *
 * Never import this from a client component — it reads the secret key. The
 * client-safe half of billing is `lib/billing.ts`.
 */

/** One price per plan *and* billing period, as separate Stripe Prices. */
const PRICE_ENV_VARS: Record<PaidPlanId, Record<BillingPeriod, string>> = {
  pro: {
    monthly: "STRIPE_PRICE_PRO_MONTHLY",
    annual: "STRIPE_PRICE_PRO_ANNUAL",
  },
  business: {
    monthly: "STRIPE_PRICE_BUSINESS_MONTHLY",
    annual: "STRIPE_PRICE_BUSINESS_ANNUAL",
  },
}

/**
 * The Stripe SDK caches nothing that matters, but Next's dev server re-executes
 * modules on every change — one client on `globalThis` keeps that from piling
 * up sockets, the same way `lib/db.ts` does for Prisma.
 */
const globalForStripe = globalThis as unknown as { stripe?: Stripe }

function createClient() {
  const key = process.env.STRIPE_SECRET_KEY

  if (!key) {
    throw new Error(
      "STRIPE_SECRET_KEY is not set. Billing is disabled until it is — see .env.example."
    )
  }

  // Pinned rather than left to the SDK default, so upgrading the package can't
  // silently change the shape of what the webhook handler parses.
  return new Stripe(key, { apiVersion: "2026-07-29.dahlia" })
}

/**
 * Lazily built, so importing this module on a machine with no keys doesn't
 * throw — `isBillingConfigured()` can then answer honestly and the Billing tab
 * renders an explanation instead of a crash.
 */
export function getStripe() {
  return (globalForStripe.stripe ??= createClient())
}

/** True when there's a key and at least one price to sell. */
export function isBillingConfigured() {
  if (!process.env.STRIPE_SECRET_KEY) return false

  return Object.values(PRICE_ENV_VARS).some((periods) =>
    Object.values(periods).some((name) => Boolean(process.env[name]))
  )
}

/** The Stripe Price for a plan on a billing period, or null if unconfigured. */
export function stripePriceId(planId: PaidPlanId, period: BillingPeriod) {
  return process.env[PRICE_ENV_VARS[planId][period]] || null
}

/**
 * The reverse lookup the webhook needs: Stripe hands back a price id, and the
 * entitlement is whichever plan that id was configured as. An id we don't
 * recognise resolves to `free` — an unknown price can't grant anything.
 */
export function planForPrice(priceId: string | null | undefined): {
  planId: PlanId
  period: BillingPeriod | null
} {
  if (!priceId) return { planId: "free", period: null }

  for (const [planId, periods] of Object.entries(PRICE_ENV_VARS)) {
    for (const [period, envVar] of Object.entries(periods)) {
      if (process.env[envVar] === priceId && isPaidPlanId(planId)) {
        return { planId, period: period as BillingPeriod }
      }
    }
  }

  return { planId: "free", period: null }
}

/** Absolute URLs for Stripe to send the customer back to. */
export function appUrl(path = "") {
  const base =
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.BETTER_AUTH_URL ??
    "http://localhost:3000"

  return `${base.replace(/\/$/, "")}${path}`
}

/**
 * Tags Checkout Sessions so they can be compared in the Stripe Dashboard.
 * Stripe asks for eight random letters on the end; they identify this
 * integration's build, not the customer.
 */
export function integrationIdentifier() {
  return "docsy-billing-qkzvhtwm"
}

"use client"

import * as React from "react"

import { planName, type PaidPlanId, type PlanId } from "@/lib/billing"
import type { BillingPeriod } from "@/lib/pricing"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "@/components/ui/toast"
import { BillingToggle } from "@/components/marketing/billing-toggle"

/**
 * The buttons on the Billing tab. Every one of them does the same thing: ask
 * the server for a Stripe URL and follow it.
 *
 * Nothing here changes a plan. Checkout and the Customer Portal both hand the
 * change back through the webhook, which is the only writer of entitlements —
 * so a button that fails leaves the workspace exactly as it was.
 */

/** POSTs to a billing route and returns the Stripe URL it answers with. */
async function stripeUrl(path: string, body?: unknown) {
  const response = await fetch(path, {
    method: "POST",
    ...(body !== undefined && {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  })

  const payload = await response.json().catch(() => null)

  if (!response.ok || !payload?.url) {
    throw new Error(payload?.error ?? "Try again in a moment.")
  }

  return payload.url as string
}

function useStripeRedirect() {
  const [pending, setPending] = React.useState<string | null>(null)

  const go = React.useCallback(
    async (id: string, path: string, body?: unknown) => {
      setPending(id)

      try {
        // A full navigation, not `router.push`: the destination is Stripe's.
        window.location.href = await stripeUrl(path, body)
      } catch (error) {
        setPending(null)
        toast.add({
          type: "error",
          title: "Couldn't open Stripe.",
          description:
            error instanceof Error ? error.message : "Try again in a moment.",
        })
      }
    },
    []
  )

  return { pending, go }
}

/**
 * The plan banner's controls.
 *
 * A workspace with a Stripe customer gets the portal — that's where changing
 * plan, swapping the card and cancelling all live, and it already knows how to
 * prorate. Everything else is a checkout for the plan above.
 */
function PlanActions({
  planId,
  hasCustomer,
  upgrades,
}: {
  planId: PlanId
  /** False before the first checkout, when there's no portal to open. */
  hasCustomer: boolean
  /** Paid plans this workspace can move to, in ladder order. */
  upgrades: PaidPlanId[]
}) {
  const [period, setPeriod] = React.useState<BillingPeriod>("monthly")
  const { pending, go } = useStripeRedirect()

  return (
    <div className="flex flex-wrap items-center gap-3">
      {upgrades.length > 0 && (
        <BillingToggle
          className="mr-1"
          value={period}
          onValueChange={setPeriod}
        />
      )}

      {hasCustomer && (
        <Button
          variant="outline"
          size="lg"
          className="cursor-pointer bg-background px-4"
          disabled={pending !== null}
          onClick={() => go("portal", "/api/billing/portal")}
        >
          {pending === "portal" && <Spinner />}
          {planId === "free" ? "Billing history" : "Manage plan"}
        </Button>
      )}

      {upgrades.map((upgrade, index) => (
        <Button
          key={upgrade}
          // The top of the ladder gets the solid button; anything below it is
          // the quieter option beside it.
          variant={index === upgrades.length - 1 ? "default" : "outline"}
          size="lg"
          className={
            index === upgrades.length - 1
              ? "cursor-pointer px-4"
              : "cursor-pointer bg-background px-4"
          }
          disabled={pending !== null}
          onClick={() =>
            go(upgrade, "/api/billing/checkout", { plan: upgrade, period })
          }
        >
          {pending === upgrade && <Spinner />}
          {planId === "free" ? "Get " : "Upgrade to "}
          {planName(upgrade)}
        </Button>
      ))}
    </div>
  )
}

/** The payment-method row's button — the portal is where cards are managed. */
function ManagePaymentMethodButton({
  hasCard,
  hasCustomer,
}: {
  hasCard: boolean
  hasCustomer: boolean
}) {
  const { pending, go } = useStripeRedirect()

  return (
    <Button
      variant="outline"
      size="lg"
      className="ml-auto cursor-pointer px-4"
      // Without a Stripe customer there is no portal to send them to; the card
      // gets added during their first checkout instead.
      disabled={!hasCustomer || pending !== null}
      onClick={() => go("portal", "/api/billing/portal")}
    >
      {pending === "portal" && <Spinner />}
      {hasCard ? "Update" : "Add card"}
    </Button>
  )
}

export { ManagePaymentMethodButton, PlanActions }

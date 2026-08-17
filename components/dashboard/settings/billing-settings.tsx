import {
  billingWarning,
  formatBillingDate,
  nextPlanUp,
  planName,
  planTerms,
  type PaidPlanId,
  type PlanId,
} from "@/lib/billing"
import { getBillingView } from "@/lib/billing-store"
import { requireOrganization } from "@/lib/session"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ManagePaymentMethodButton,
  PlanActions,
} from "@/components/dashboard/settings/billing-actions"

/** Every paid plan above the current one, in ladder order. */
function upgradesFrom(planId: PlanId) {
  const upgrades: PaidPlanId[] = []

  for (let next = nextPlanUp(planId); next; next = nextPlanUp(next)) {
    upgrades.push(next)
  }

  return upgrades
}

/**
 * The Billing tab — `ui-design/dashboard/light/dashboard-billing-page.png`.
 *
 * Reads the workspace's entitlement through the same helper the chat composer
 * and the messages route use, so this page can't advertise a plan the product
 * isn't honouring. The plan, renewal date and card come from our own row;
 * Stripe is called only for the invoice list.
 *
 * `checkout` is the query Stripe redirects back with. By the time it's read the
 * page has already reconciled the session against Stripe (see the route), so a
 * paid plan is usually live on this very render — and when it isn't, that means
 * the payment genuinely hasn't confirmed yet, which is what the notice says.
 */
async function BillingSettings({ checkout }: { checkout?: string }) {
  const organization = await requireOrganization()
  const view = await getBillingView(organization.id)

  const upgrades = upgradesFrom(view.planId)
  const warning = billingWarning(view)
  const awaitingPayment = checkout === "success" && view.planId === "free"

  return (
    <div className="flex flex-col gap-6">
      {!view.configured && (
        <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
          Billing isn&apos;t configured on this deployment yet. Add your Stripe
          keys and price IDs to <code>.env</code> to turn checkout on.
        </p>
      )}

      {awaitingPayment && (
        <p className="rounded-xl border border-brand bg-brand/10 p-4 text-sm">
          Thanks — your payment is still confirming with your bank. Your plan
          starts the moment it clears, and you don&apos;t need to pay again.
        </p>
      )}

      {checkout === "cancelled" && (
        <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
          Checkout was cancelled, so nothing was charged and your plan
          hasn&apos;t changed.
        </p>
      )}

      {warning && (
        <p className="rounded-xl border border-destructive/50 bg-destructive/10 p-4 text-sm">
          {warning}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-brand bg-brand/10 p-6">
        <div>
          <p className="font-semibold">{planName(view.planId)} plan</p>
          <p className="text-sm text-muted-foreground">{planTerms(view)}</p>
        </div>

        {view.configured && (
          <PlanActions
            planId={view.planId}
            hasCustomer={view.hasCustomer}
            upgrades={upgrades}
          />
        )}
      </div>

      <Card className="[--card-spacing:--spacing(6)]">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            Payment method
          </CardTitle>
        </CardHeader>

        <CardContent className="flex flex-wrap items-center gap-3">
          {view.card ? (
            <>
              <span className="rounded-md border bg-muted px-2 py-1 text-[0.625rem] font-bold tracking-wider uppercase">
                {view.card.brand}
              </span>
              <span className="text-sm">
                <span aria-hidden>•••• </span>
                <span className="sr-only">Card ending in </span>
                <span className="font-medium">{view.card.last4}</span>
                {view.card.expires && (
                  <span className="text-muted-foreground">
                    {" "}
                    · expires {view.card.expires}
                  </span>
                )}
              </span>
            </>
          ) : (
            <span className="text-sm text-muted-foreground">
              No card on file. You&apos;ll add one when you pick a plan.
            </span>
          )}

          <ManagePaymentMethodButton
            hasCard={Boolean(view.card)}
            hasCustomer={view.hasCustomer}
          />
        </CardContent>
      </Card>

      <Card className="gap-0 [--card-spacing:--spacing(6)]">
        <CardHeader className="pb-6">
          <CardTitle className="text-lg font-semibold">Invoices</CardTitle>
        </CardHeader>

        <div className="divide-y border-t">
          {view.invoices.length === 0 ? (
            <p className="px-6 py-8 text-center text-sm text-muted-foreground">
              No invoices yet. They appear here after your first payment.
            </p>
          ) : (
            view.invoices.map((invoice) => (
              <div
                key={invoice.id}
                className="flex items-center gap-4 px-6 py-4 text-sm"
              >
                <span className="flex-1">
                  {formatBillingDate(invoice.date)}
                </span>
                <span className="text-muted-foreground tabular-nums">
                  {invoice.amount}
                </span>
                <span className="rounded-md bg-brand/15 px-2 py-0.5 text-[0.625rem] font-bold tracking-wider text-brand uppercase">
                  {invoice.status}
                </span>

                {invoice.pdfUrl ? (
                  <a
                    href={invoice.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="cursor-pointer text-sm transition-colors hover:text-brand"
                  >
                    Download
                    <span className="sr-only">
                      {" "}
                      invoice for {formatBillingDate(invoice.date)}
                    </span>
                  </a>
                ) : (
                  <span className="text-sm text-muted-foreground">—</span>
                )}
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  )
}

export { BillingSettings }

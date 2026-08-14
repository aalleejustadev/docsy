import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

/** Design copy — replaced when billing is actually wired up. */
const PLAN = {
  name: "Pro plan",
  terms: "$19 / month · renews Aug 20, 2026",
}

const PAYMENT_METHOD = {
  brand: "VISA",
  last4: "4242",
  expires: "09/28",
}

const INVOICES = [
  { id: "2026-07", date: "Jul 20, 2026", amount: "$19.00", status: "Paid" },
  { id: "2026-06", date: "Jun 20, 2026", amount: "$19.00", status: "Paid" },
  { id: "2026-05", date: "May 20, 2026", amount: "$19.00", status: "Paid" },
]

/** The Billing tab — `ui-design/dashboard/light/dashboard-billing-page.png`. */
function BillingSettings() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-brand bg-brand/10 p-6">
        <div>
          <p className="font-semibold">{PLAN.name}</p>
          <p className="text-sm text-muted-foreground">{PLAN.terms}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            size="lg"
            className="cursor-pointer bg-background px-4"
          >
            Change plan
          </Button>
          <Button size="lg" className="cursor-pointer px-4">
            Upgrade to Business
          </Button>
        </div>
      </div>

      <Card className="[--card-spacing:--spacing(6)]">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            Payment method
          </CardTitle>
        </CardHeader>

        <CardContent className="flex flex-wrap items-center gap-3">
          <span className="rounded-md border bg-muted px-2 py-1 text-[0.625rem] font-bold tracking-wider">
            {PAYMENT_METHOD.brand}
          </span>
          <span className="text-sm">
            <span aria-hidden>•••• </span>
            <span className="sr-only">Card ending in </span>
            <span className="font-medium">{PAYMENT_METHOD.last4}</span>
            <span className="text-muted-foreground">
              {" "}
              · expires {PAYMENT_METHOD.expires}
            </span>
          </span>

          <Button
            variant="outline"
            size="lg"
            className="ml-auto cursor-pointer px-4"
          >
            Update
          </Button>
        </CardContent>
      </Card>

      <Card className="gap-0 [--card-spacing:--spacing(6)]">
        <CardHeader className="pb-6">
          <CardTitle className="text-lg font-semibold">Invoices</CardTitle>
        </CardHeader>

        <div className="divide-y border-t">
          {INVOICES.map((invoice) => (
            <div
              key={invoice.id}
              className="flex items-center gap-4 px-6 py-4 text-sm"
            >
              <span className="flex-1">{invoice.date}</span>
              <span className="text-muted-foreground tabular-nums">
                {invoice.amount}
              </span>
              <span className="rounded-md bg-brand/15 px-2 py-0.5 text-[0.625rem] font-bold tracking-wider text-brand uppercase">
                {invoice.status}
              </span>
              <button
                type="button"
                className="cursor-pointer text-sm transition-colors hover:text-brand"
              >
                Download
                <span className="sr-only"> invoice for {invoice.date}</span>
              </button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

export { BillingSettings }

import { CheckIcon } from "lucide-react"

import type { BillingPeriod, Plan } from "@/lib/pricing"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { AuthDialogTrigger } from "@/components/auth/auth-dialog-trigger"

function PricingCard({
  plan,
  period,
  className,
}: {
  plan: Plan
  period: BillingPeriod
  className?: string
}) {
  const price = plan.price[period]

  return (
    <Card
      className={cn(
        // `overflow-visible` lets the "Most popular" badge straddle the border.
        "relative overflow-visible [--card-spacing:--spacing(7)]",
        plan.highlighted && "shadow-xl ring-2 shadow-brand/25 ring-brand",
        className
      )}
    >
      {plan.highlighted ? (
        <Badge className="absolute -top-2.5 left-7 rounded-md bg-brand font-mono text-[0.625rem] tracking-wider text-brand-foreground uppercase">
          Most popular
        </Badge>
      ) : null}

      <CardHeader className="gap-1.5">
        <CardTitle className="text-lg font-semibold">{plan.name}</CardTitle>
        <CardDescription>{plan.description}</CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-1.5">
        <p className="flex items-baseline gap-1">
          <span className="text-[2.75rem] leading-none font-bold tracking-tight">
            ${price}
          </span>
          <span className="text-sm text-muted-foreground">/mo</span>
        </p>
        {price > 0 && period === "annual" ? (
          <p className="text-sm text-muted-foreground">billed annually</p>
        ) : null}
      </CardContent>

      <CardContent>
        <AuthDialogTrigger
          mode="sign-up"
          variant={plan.ctaVariant}
          className="h-10 w-full"
        >
          {plan.cta.label}
        </AuthDialogTrigger>
      </CardContent>

      <CardContent>
        <ul className="flex flex-col gap-3">
          {plan.features.map((feature) => (
            <li key={feature.label} className="flex items-start gap-3 text-sm">
              <CheckIcon className="mt-0.5 size-4 shrink-0 text-brand" />
              <span className={cn(feature.emphasis && "font-semibold")}>
                {feature.label}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

export { PricingCard }

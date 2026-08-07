import Link from "next/link"
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
import { Button } from "@/components/ui/button"

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
        plan.highlighted && "shadow-xl shadow-brand/25 ring-2 ring-brand",
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
        <Button
          variant={plan.ctaVariant}
          className="h-10 w-full"
          render={<Link href={plan.cta.href} />}
          nativeButton={false}
        >
          {plan.cta.label}
        </Button>
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

"use client"

import { ANNUAL_DISCOUNT, type BillingPeriod } from "@/lib/pricing"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

const SWITCH_ID = "billing-period"

function BillingToggle({
  value,
  onValueChange,
  className,
}: {
  value: BillingPeriod
  onValueChange: (value: BillingPeriod) => void
  className?: string
}) {
  return (
    <div className={cn("flex items-center justify-center gap-3", className)}>
      <Label
        htmlFor={SWITCH_ID}
        className={cn(
          "cursor-pointer",
          value === "monthly" ? "text-foreground" : "text-muted-foreground"
        )}
      >
        Monthly
      </Label>
      <Switch
        id={SWITCH_ID}
        className="cursor-pointer"
        checked={value === "annual"}
        onCheckedChange={(checked) =>
          onValueChange(checked ? "annual" : "monthly")
        }
      />
      <Label
        htmlFor={SWITCH_ID}
        className={cn(
          "cursor-pointer",
          value === "annual" ? "text-foreground" : "text-muted-foreground"
        )}
      >
        Annual
        <Badge className="rounded-md bg-brand/15 font-mono text-[0.625rem] font-bold text-brand">
          {ANNUAL_DISCOUNT}
        </Badge>
      </Label>
    </div>
  )
}

export { BillingToggle }

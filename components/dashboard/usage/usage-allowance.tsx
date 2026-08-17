import Link from "next/link"
import { ArrowRightIcon } from "lucide-react"

import { isUnlimited } from "@/lib/chat"
import { BILLING_ROUTE } from "@/lib/dashboard-nav"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"

/**
 * A ratio against a limit reads as state, so the fill carries severity: brand
 * while there's room, destructive once the allowance is spent. Both strings are
 * written out in full — Tailwind can't see a class built by interpolation.
 */
function meterTone(ratio: number) {
  return ratio >= 1
    ? "**:data-[slot=progress-indicator]:bg-destructive"
    : "**:data-[slot=progress-indicator]:bg-brand"
}

/** The headline allowance card — `ui-design/dashboard/light/usage-page.png`. */
function UsageAllowance({
  questions,
  limit,
}: {
  questions: number
  limit: number
}) {
  // Business has no ceiling, so there is no ratio to draw and nothing to count
  // down to — the card shows what was asked and leaves the meter empty.
  const unlimited = isUnlimited(limit)
  const ratio = unlimited ? 0 : questions / limit
  const percent = Math.min(100, Math.round(ratio * 100))
  const remaining = Math.max(0, limit - questions)

  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Questions this month</p>

          <p className="mt-1 text-4xl font-bold tracking-tight">
            {questions}
            <span className="ml-1.5 text-lg font-normal text-muted-foreground">
              {unlimited ? "of unlimited" : `/ ${limit}`}
            </span>
          </p>
        </div>

        <Button
          variant="outline"
          size="lg"
          nativeButton={false}
          className="cursor-pointer"
          render={<Link href={BILLING_ROUTE} />}
        >
          {unlimited ? "Manage plan" : "Upgrade for more"}
          <ArrowRightIcon data-icon="inline-end" />
        </Button>
      </div>

      <Progress
        value={percent}
        aria-label={
          unlimited
            ? `${questions} questions asked this month, on an unlimited plan`
            : `${questions} of ${limit} questions used this month`
        }
        className={cn(
          "mt-4 **:data-[slot=progress-track]:h-2 **:data-[slot=progress-track]:bg-brand/15",
          "**:data-[slot=progress-indicator]:rounded-full",
          meterTone(ratio)
        )}
      />

      <div className="mt-2 flex items-center justify-between font-mono text-sm text-muted-foreground">
        <span>
          {unlimited
            ? "Unlimited questions on this plan"
            : remaining === 0
              ? "No questions remaining"
              : `${remaining} ${remaining === 1 ? "question" : "questions"} remaining`}
        </span>
        <span>{unlimited ? "" : `${percent}%`}</span>
      </div>
    </div>
  )
}

export { UsageAllowance }

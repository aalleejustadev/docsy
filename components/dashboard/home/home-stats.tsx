import Link from "next/link"

import { planName } from "@/lib/billing"
import { isUnlimited } from "@/lib/chat"
import { getWorkspaceStats } from "@/lib/chat-store"
import { BILLING_ROUTE } from "@/lib/dashboard-nav"
import { requireOrganization } from "@/lib/session"
import { cn } from "@/lib/utils"
import { Progress } from "@/components/ui/progress"

/**
 * A ratio against a limit reads as state, so the fill carries severity: the
 * brand accent while there's room, destructive once the allowance is spent.
 * Both class strings are written out in full — Tailwind can't see a name that
 * only exists after string interpolation.
 */
function meterTone(ratio: number) {
  return ratio >= 1
    ? "**:data-[slot=progress-indicator]:bg-destructive"
    : "**:data-[slot=progress-indicator]:bg-brand"
}

function StatTile({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-card p-5">
      <span className="text-sm text-muted-foreground">{label}</span>
      {children}
    </div>
  )
}

/**
 * The headline numbers — `ui-design/dashboard/light/dashboard-home.png`.
 *
 * Three tiles, not three charts: each is a single current value, and the one
 * ratio among them is a meter. Values use proportional figures (`tabular-nums`
 * is for columns that must align, not for standalone numbers).
 */
async function HomeStats() {
  const organization = await requireOrganization()
  const {
    documentsIndexed,
    documentsPending,
    questionsThisMonth,
    planId,
    questionLimit,
  } = await getWorkspaceStats(organization.id)

  // An unlimited allowance has no ratio to draw, so the meter reads as empty
  // rather than as a bar that can never move.
  const unlimited = isUnlimited(questionLimit)
  const ratio = unlimited ? 0 : questionsThisMonth / questionLimit

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <StatTile label="Documents indexed">
        <span className="text-3xl font-bold tracking-tight">
          {documentsIndexed}
        </span>

        {documentsPending > 0 && (
          <span className="text-sm text-muted-foreground">
            {documentsPending} still being read
          </span>
        )}
      </StatTile>

      <StatTile label="Questions this month">
        {/* The value doubles as the meter's label — an amber fill alone would
            sit under 3:1 against the card. */}
        <span className="text-3xl font-bold tracking-tight">
          {questionsThisMonth}
          <span className="ml-1 text-lg font-normal text-muted-foreground">
            {unlimited ? "this month" : `/ ${questionLimit}`}
          </span>
        </span>

        <Progress
          value={Math.min(100, Math.round(ratio * 100))}
          aria-label={
            unlimited
              ? `${questionsThisMonth} questions asked this month, on an unlimited plan`
              : `${questionsThisMonth} of ${questionLimit} questions used this month`
          }
          className={cn(
            "mt-auto **:data-[slot=progress-track]:h-1.5 **:data-[slot=progress-track]:bg-brand/15",
            "**:data-[slot=progress-indicator]:rounded-full",
            meterTone(ratio)
          )}
        />
      </StatTile>

      {/* The workspace's entitlement, not a label: `planId` is `free` until a
          Stripe subscription says otherwise. */}
      <StatTile label="Current plan">
        <span className="flex items-center gap-3">
          <span className="text-3xl font-bold tracking-tight">
            {planName(planId)}
          </span>
          <Link
            href={BILLING_ROUTE}
            className="rounded-md bg-brand/15 px-2 py-1 text-xs font-medium text-brand transition-colors hover:bg-brand/25"
          >
            {planId === "free" ? "Upgrade" : "Manage"}
          </Link>
        </span>
      </StatTile>
    </div>
  )
}

export { HomeStats }

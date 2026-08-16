import type { Metadata } from "next"

import { getUsage } from "@/lib/chat-store"
import { requireOrganization } from "@/lib/session"
import { formatDuration, formatPeriod, USAGE_CHART_DAYS } from "@/lib/usage"
import { UsageAllowance } from "@/components/dashboard/usage/usage-allowance"
import { UsageChart } from "@/components/dashboard/usage/usage-chart"
import { UsageDocuments } from "@/components/dashboard/usage/usage-documents"

export const metadata: Metadata = {
  title: "Usage",
}

function StatTile({
  label,
  value,
  suffix,
}: {
  label: string
  value: string
  /** The denominator or unit set beside the figure, in muted ink. */
  suffix?: string
}) {
  return (
    <div className="rounded-xl border bg-card p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-3xl font-bold tracking-tight">
        {value}
        {suffix && (
          <span className="ml-1.5 text-base font-normal text-muted-foreground">
            {suffix}
          </span>
        )}
      </p>
    </div>
  )
}

function Panel({
  title,
  aside,
  children,
  bodyClassName,
}: {
  title: string
  /** Right-aligned note beside the title, e.g. the chart's window. */
  aside?: string
  children: React.ReactNode
  bodyClassName?: string
}) {
  return (
    <section className="rounded-xl border bg-card">
      <div className="flex items-center justify-between gap-4 px-5 pt-5 pb-4">
        <h3 className="font-heading font-bold tracking-tight">{title}</h3>
        {aside && (
          <span className="font-mono text-xs text-muted-foreground">
            {aside}
          </span>
        )}
      </div>

      <div className={bodyClassName}>{children}</div>
    </section>
  )
}

/** Usage — `ui-design/dashboard/light/usage-page.png`. */
export default async function UsagePage() {
  const organization = await requireOrganization()
  const usage = await getUsage(organization.id)

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-10">
      <h2 className="font-heading text-3xl font-bold tracking-tight">Usage</h2>
      {/* "Billing cycle" in the reference, but nothing bills yet. This is the
          window the question allowance is actually counted over. */}
      <p className="mt-2 text-muted-foreground">
        Allowance period {formatPeriod(usage.period)} ·{" "}
        {usage.period.resetsInDays === 0
          ? "resets today."
          : `resets in ${usage.period.resetsInDays} ${usage.period.resetsInDays === 1 ? "day" : "days"}.`}
      </p>

      <div className="mt-6 flex flex-col gap-4">
        <UsageAllowance
          questions={usage.questions}
          limit={usage.questionLimit}
        />

        <div className="grid gap-4 sm:grid-cols-3">
          <StatTile
            label="Documents indexed"
            value={String(usage.documentsIndexed)}
            suffix="/ unlimited"
          />
          <StatTile
            label="Citations verified"
            value={String(usage.citations)}
          />
          <StatTile
            label="Avg. answer time"
            value={
              usage.averageAnswerSeconds === null
                ? "—"
                : formatDuration(usage.averageAnswerSeconds)
            }
          />
        </div>

        <Panel
          title="Questions per day"
          aside={`last ${USAGE_CHART_DAYS} days`}
          bodyClassName="px-5 pb-5"
        >
          <UsageChart days={usage.days} />
        </Panel>

        <Panel title="Most-questioned documents" bodyClassName="border-t">
          <UsageDocuments documents={usage.documents} />
        </Panel>
      </div>
    </div>
  )
}

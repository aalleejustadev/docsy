import { formatCount, type AdminOverview } from "@/lib/admin"

/**
 * One headline figure. `suffix` is the denominator set beside it in muted ink —
 * "86 / 312" — so the pair reads as one number with context rather than two.
 */
function StatTile({
  label,
  value,
  suffix,
}: {
  label: string
  value: string
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

/**
 * The console's four numbers — `ui-design/dashboard/light/admin-page.png`.
 *
 * Every one of them is measured across the whole app rather than a workspace,
 * which is the difference between this row and the one on the dashboard home
 * page. Values use proportional figures: `tabular-nums` is for columns that
 * must align, not for standalone numbers.
 */
function AdminStats({ overview }: { overview: AdminOverview }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatTile
        label="Documents indexed"
        value={formatCount(overview.documentsIndexed)}
      />
      <StatTile
        label="Questions this month"
        value={formatCount(overview.questionsThisMonth)}
      />
      <StatTile
        label="Active users · 30d"
        value={formatCount(overview.activeUsers)}
      />
      <StatTile
        label="Paid subscribers"
        value={formatCount(overview.paidSubscribers)}
        suffix={`/ ${formatCount(overview.totalUsers)}`}
      />
    </div>
  )
}

export { AdminStats }

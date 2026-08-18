import type { Metadata } from "next"
import { InfoIcon } from "lucide-react"

import { ADMIN_ACTIVE_WINDOW_DAYS, ADMIN_QUERY_MAX } from "@/lib/admin"
import { requireAdmin } from "@/lib/session"
import { AdminUsersFilter } from "@/components/admin/users/admin-users-filter"
import { AdminUsersTable } from "@/components/admin/users/admin-users-table"

export const metadata: Metadata = {
  title: "Users · Admin",
}

/**
 * `/app/admin/users` — every account in the app.
 *
 * Search and page live in the query string, so a filtered view is a link an
 * admin can send to another admin. The table reads them back and re-queries;
 * nothing here is client state.
 */
export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>
}) {
  await requireAdmin()

  const { q, page } = await searchParams
  const query = (q ?? "").slice(0, ADMIN_QUERY_MAX)
  const current = Number.parseInt(page ?? "1", 10)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <AdminUsersFilter query={query} />

        {/* Keyed on the search and page so a new query gets its own render
            rather than reusing the last one's rows while it resolves. */}
        <AdminUsersTable
          key={`${query}:${current}`}
          query={query}
          page={Number.isNaN(current) ? 1 : current}
        />
      </div>

      <p className="flex items-start gap-2 rounded-xl border bg-muted/40 p-4 text-sm text-muted-foreground">
        <InfoIcon className="mt-0.5 size-4 shrink-0" />
        <span>
          <span className="font-semibold text-foreground">Inactive</span> means
          no sign-in and no questions asked in the last{" "}
          {ADMIN_ACTIVE_WINDOW_DAYS} days.{" "}
          <span className="font-semibold text-foreground">Deactivated</span>{" "}
          means the account is blocked from signing in.
        </span>
      </p>
    </div>
  )
}

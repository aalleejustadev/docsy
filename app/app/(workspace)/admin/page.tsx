import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRightIcon } from "lucide-react"

import { ADMIN_TABS } from "@/lib/admin"
import { getAdminOverview } from "@/lib/admin-store"
import { requireAdmin } from "@/lib/session"
import { AdminActiveUsers } from "@/components/admin/overview/admin-active-users"
import { AdminStats } from "@/components/admin/overview/admin-stats"

export const metadata: Metadata = {
  title: "Admin",
}

/** The Users tab, once it exists — the destination of "Manage users". */
const usersTab = ADMIN_TABS.find((tab) => tab.label === "Users")!

/**
 * `/app/admin` — the Overview tab, and the console's landing section.
 *
 * One trip to the database for the whole panel: the tiles and the leaderboard
 * are counts over the same tables, so splitting them across two self-fetching
 * sections would only buy duplicate queries.
 *
 * Guarded here as well as in the layout, and that is not belt-and-braces: Next
 * renders a layout and its page *concurrently*, so a layout redirect doesn't
 * stop this component running. Without this line the counts are queried — and
 * flushed into the streamed response — before the layout's redirect lands. The
 * session is cached per request, so asking twice costs nothing.
 */
export default async function AdminOverviewPage() {
  await requireAdmin()

  const overview = await getAdminOverview()

  return (
    <div className="flex flex-col gap-6">
      <AdminStats overview={overview} />

      <AdminActiveUsers users={overview.mostActive} />

      {usersTab.ready ? (
        <Link
          href={usersTab.href}
          className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-brand transition-colors hover:text-brand/80"
        >
          Manage users
          <ArrowRightIcon className="size-4" />
        </Link>
      ) : (
        // The Users tab hasn't been built yet, so this is the label without the
        // link rather than a promise the console can't keep.
        <span className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-muted-foreground">
          Manage users
          <ArrowRightIcon className="size-4" />
        </span>
      )}
    </div>
  )
}

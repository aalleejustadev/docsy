import Link from "next/link"

import {
  libraryHref,
  libraryStatusFilters,
  type LibraryCountsView,
  type LibraryStatusFilter,
} from "@/lib/library"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { LibraryTabCount } from "@/components/dashboard/library/library-tab-count"

/**
 * The segmented control over the table — "All 14 · Indexed 9 · Indexing 3 ·
 * Failed 2".
 *
 * Links rather than a `Tabs` widget: each one is a different URL with its own
 * server-rendered rows, so `role="tab"` would promise a panel that swaps in
 * place and no `tabpanel` exists to point at. The look is the tabs list's.
 */
function LibraryStatusTabs({
  status,
  query,
  counts,
}: {
  status: LibraryStatusFilter
  /** Carried through, so narrowing by status keeps the search you typed. */
  query: string
  counts: LibraryCountsView["counts"]
}) {
  return (
    <nav
      aria-label="Filter documents by status"
      className="inline-flex h-10 items-center gap-1 rounded-lg bg-muted p-1"
    >
      {libraryStatusFilters.map((filter) => {
        const isActive = filter.value === status

        return (
          <Link
            key={filter.value}
            href={libraryHref({ status: filter.value, query })}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "h-8 gap-1.5 px-3 text-sm text-muted-foreground hover:bg-transparent hover:text-foreground",
              isActive &&
                "bg-background text-foreground shadow-sm hover:bg-background dark:bg-input/30"
            )}
          >
            {filter.label}
            <LibraryTabCount count={counts[filter.value]} isActive={isActive} />
          </Link>
        )
      })}
    </nav>
  )
}

export { LibraryStatusTabs }

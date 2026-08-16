"use client"

import { useLinkStatus } from "next/link"

import { cn } from "@/lib/utils"
import { Spinner } from "@/components/ui/spinner"

/**
 * The number on a status tab, which becomes a spinner while that tab's
 * navigation is in flight.
 *
 * Filtering is a server round-trip, so between the click and the new rows
 * there is a beat where nothing moves. `useLinkStatus` reports that beat for
 * the link this sits inside — it has to be a descendant of the `Link`, which
 * is why the count is its own component rather than a span in the tab strip.
 *
 * The spinner is laid over the count in a fixed-width box rather than swapped
 * for it, so the tab doesn't change width and shove its neighbours along.
 */
function LibraryTabCount({
  count,
  isActive,
}: {
  count: number
  isActive: boolean
}) {
  const { pending } = useLinkStatus()

  return (
    <span
      className={cn(
        "relative grid min-w-3 place-items-center tabular-nums",
        isActive ? "text-muted-foreground" : "text-muted-foreground/60"
      )}
    >
      <span className={cn("col-start-1 row-start-1", pending && "opacity-0")}>
        {count}
      </span>

      {pending && (
        <Spinner
          className="col-start-1 row-start-1 size-3"
          aria-label="Loading"
        />
      )}
    </span>
  )
}

export { LibraryTabCount }

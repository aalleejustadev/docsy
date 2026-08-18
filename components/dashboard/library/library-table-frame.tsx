import { cn } from "@/lib/utils"
import { Table, TableHead, TableHeader, TableRow } from "@/components/ui/table"

/**
 * The card, the table element and the header row the library table sits in.
 *
 * Owned in one place and shared with the loading skeleton, so the two are
 * necessarily the same shape — the skeleton's whole job is to hold the space
 * the rows are about to occupy, and it can only do that if it can't drift.
 *
 * `table-fixed` is what makes the widths below stick. Under the default `auto`
 * layout a declared width is only a hint, and the columns shuffle sideways
 * the moment real filenames replace the placeholders.
 */

const headCell =
  "h-11 px-6 text-[0.6875rem] font-bold tracking-[0.08em] text-muted-foreground uppercase"

/** Name takes whatever is left over; the rest are pinned. */
const columns = [
  { label: "Name", className: "w-full" },
  { label: "Type", className: "w-32" },
  { label: "Status", className: "w-40" },
  { label: "Added", className: "w-32" },
]

function LibraryTableFrame({
  children,
  footer,
}: {
  /** The table body — the rows, or their placeholders. */
  children: React.ReactNode
  /** The strip under the table: the range label, and the pager beside it. */
  footer: React.ReactNode
}) {
  return (
    <div className="mt-5 overflow-hidden rounded-xl border bg-card">
      {/* Same reason as the admin users table: the pinned columns add up to
          480px, so without a floor the Name column collapses to nothing on a
          phone. Below this width the table scrolls sideways inside `Table`'s
          container rather than crushing its first column. */}
      <Table className="min-w-184 table-fixed">
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            {columns.map((column) => (
              <TableHead
                key={column.label}
                className={cn(headCell, column.className)}
              >
                {column.label}
              </TableHead>
            ))}

            <TableHead className="w-16 px-6">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>

        {children}
      </Table>

      <div className="flex flex-wrap items-center justify-between gap-4 border-t px-6 py-4">
        {footer}
      </div>
    </div>
  )
}

export { LibraryTableFrame }

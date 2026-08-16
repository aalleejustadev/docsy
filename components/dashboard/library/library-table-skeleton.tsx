import { LIBRARY_PAGE_SIZE } from "@/lib/library"
import { Skeleton } from "@/components/ui/skeleton"
import { TableBody, TableCell, TableRow } from "@/components/ui/table"
import { LibraryTableFrame } from "@/components/dashboard/library/library-table-frame"

/**
 * What sits in the table's place while the rows are being fetched.
 *
 * Same frame and the same row height as the real table, so the rows land in
 * the space the skeleton was already holding instead of shunting the page
 * around as they arrive.
 */
function LibraryTableSkeleton({ rows = LIBRARY_PAGE_SIZE }: { rows?: number }) {
  return (
    <LibraryTableFrame footer={<Skeleton className="h-4 w-40" />}>
      <TableBody aria-hidden>
        {Array.from({ length: rows }, (_, index) => (
          <TableRow key={index} className="hover:bg-transparent">
            <TableCell className="px-6 py-4">
              <div className="flex items-center gap-3">
                <Skeleton className="size-8 shrink-0 rounded-lg" />
                <div className="min-w-0 flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-64 max-w-full" />
                  <Skeleton className="h-3.5 w-28" />
                </div>
              </div>
            </TableCell>

            <TableCell className="px-6 py-4">
              <Skeleton className="h-5 w-12 rounded-md" />
            </TableCell>

            <TableCell className="px-6 py-4">
              <Skeleton className="h-4 w-20" />
            </TableCell>

            <TableCell className="px-6 py-4">
              <Skeleton className="h-4 w-14" />
            </TableCell>

            <TableCell className="px-6 py-4">
              <Skeleton className="ml-auto size-7 rounded-md" />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </LibraryTableFrame>
  )
}

export { LibraryTableSkeleton }

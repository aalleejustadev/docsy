import { FileTextIcon } from "lucide-react"

import type { DocumentStatusView } from "@/lib/chat"
import { getLibraryRows } from "@/lib/chat-store"
import {
  libraryHref,
  LIBRARY_PAGE_SIZE,
  shortAge,
  type LibraryStatusFilter,
} from "@/lib/library"
import { rangeLabel } from "@/lib/pagination"
import { requireOrganization } from "@/lib/session"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { TableBody, TableCell, TableRow } from "@/components/ui/table"
import { Pager } from "@/components/dashboard/pager"
import { LibraryTableFrame } from "@/components/dashboard/library/library-table-frame"
import { LibraryRowActions } from "@/components/dashboard/library/library-row-actions"

/**
 * Indexing state travels as a dot *and* a word, so the meaning survives for
 * anyone who can't separate the amber from the red.
 */
const STATUS: Record<
  DocumentStatusView,
  { label: string; dot: string; text: string }
> = {
  READY: { label: "Indexed", dot: "bg-brand", text: "text-brand" },
  PROCESSING: {
    label: "Indexing…",
    dot: "bg-muted-foreground",
    text: "text-muted-foreground",
  },
  FAILED: {
    label: "Failed",
    dot: "bg-destructive",
    text: "text-destructive",
  },
}

/**
 * The library table and its pager — `dashboard-library-page.png`.
 *
 * Fetches its own rows rather than being handed them, so the page can put it
 * behind a Suspense boundary and let the toolbar paint first. The skeleton in
 * `library-table-skeleton.tsx` stands in until this resolves.
 */
async function LibraryTable({
  status,
  query,
  page,
}: {
  status: LibraryStatusFilter
  query: string
  page: number
}) {
  const organization = await requireOrganization()
  const rows = await getLibraryRows({
    organizationId: organization.id,
    status,
    query,
    page,
  })

  const { documents, total, pageCount } = rows

  return (
    <LibraryTableFrame
      footer={
        <>
          <p className="font-mono text-sm text-muted-foreground">
            {rangeLabel({
              page: rows.page,
              total,
              pageSize: LIBRARY_PAGE_SIZE,
              noun: "document",
            })}
          </p>

          <Pager
            page={rows.page}
            pageCount={pageCount}
            hrefFor={(target) => libraryHref({ status, query, page: target })}
          />
        </>
      }
    >
      <TableBody>
        {documents.length === 0 ? (
          <TableRow className="hover:bg-transparent">
            <TableCell
              colSpan={5}
              className="h-32 px-6 text-center text-sm text-muted-foreground"
            >
              No documents match that filter.
            </TableCell>
          </TableRow>
        ) : (
          documents.map((document) => {
            const state = STATUS[document.status]

            return (
              <TableRow key={document.id}>
                <TableCell className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                      <FileTextIcon className="size-4" />
                    </span>

                    <div className="min-w-0">
                      <a
                        href={`/api/documents/${document.id}`}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="block truncate font-semibold hover:underline"
                      >
                        {document.name}
                      </a>
                      <p className="truncate text-sm text-muted-foreground">
                        {document.meta}
                      </p>
                    </div>
                  </div>
                </TableCell>

                <TableCell className="px-6 py-4">
                  <Badge
                    variant="outline"
                    className="rounded-md font-mono text-[0.625rem] tracking-wider"
                  >
                    {document.format}
                  </Badge>
                </TableCell>

                <TableCell className="px-6 py-4">
                  <span
                    className={cn(
                      "flex items-center gap-1.5 text-sm",
                      state.text
                    )}
                  >
                    <span
                      aria-hidden
                      className={cn("size-1.5 rounded-full", state.dot)}
                    />
                    {state.label}
                  </span>
                </TableCell>

                <TableCell className="px-6 py-4 font-mono text-sm text-muted-foreground tabular-nums">
                  {shortAge(new Date(document.createdAt))}
                </TableCell>

                <TableCell className="px-6 py-4 text-right">
                  <LibraryRowActions document={document} />
                </TableCell>
              </TableRow>
            )
          })
        )}
      </TableBody>
    </LibraryTableFrame>
  )
}

export { LibraryTable }

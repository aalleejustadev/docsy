import { Suspense } from "react"
import type { Metadata } from "next"
import { LibraryIcon } from "lucide-react"

import { getLibraryCounts } from "@/lib/chat-store"
import {
  LIBRARY_PAGE_SIZE,
  LIBRARY_QUERY_MAX,
  toLibraryStatusFilter,
} from "@/lib/library"
import { requireOrganization } from "@/lib/session"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { LibraryFilter } from "@/components/dashboard/library/library-filter"
import { LibraryStatusTabs } from "@/components/dashboard/library/library-status-tabs"
import { LibraryTable } from "@/components/dashboard/library/library-table"
import { LibraryTableSkeleton } from "@/components/dashboard/library/library-table-skeleton"
import { LibraryUploadButton } from "@/components/dashboard/library/library-upload-button"

export const metadata: Metadata = {
  title: "Library",
}

/** `?q=a&q=b` is legal in a URL and meaningless here — take the first. */
function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

/** The workspace library — `ui-design/dashboard/light/dashboard-library-page.png`. */
export default async function LibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const organization = await requireOrganization()
  const params = await searchParams

  const status = toLibraryStatusFilter(first(params.status))
  const query = (first(params.q) ?? "").trim().slice(0, LIBRARY_QUERY_MAX)
  const requestedPage = Number.parseInt(first(params.page) ?? "1", 10)
  const page = Number.isNaN(requestedPage) ? 1 : requestedPage

  // Only the counts are awaited here. The rows are fetched by the table itself
  // under the Suspense boundary below, so switching tabs repaints the toolbar
  // straight away and shows a skeleton where the rows are going to land.
  const library = await getLibraryCounts({
    organizationId: organization.id,
    query,
  })

  return (
    <div className="mx-auto w-full max-w-272 px-6 py-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-heading text-3xl font-bold tracking-tight">
            Library
          </h2>
          <p className="mt-2 text-muted-foreground">
            {library.libraryTotal === 0
              ? "Nothing uploaded yet."
              : `${library.libraryTotal} ${library.libraryTotal === 1 ? "document" : "documents"} · indexed and searchable by meaning.`}
          </p>
        </div>

        <LibraryUploadButton />
      </div>

      {library.libraryTotal === 0 ? (
        // Nothing uploaded yet, so a filter strip over an empty table would be
        // four ways to look at nothing.
        <Empty className="mt-8 rounded-xl border border-dashed py-16">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <LibraryIcon />
            </EmptyMedia>
            <EmptyTitle>Your library is empty</EmptyTitle>
            <EmptyDescription>
              Upload a PDF, Word file, or markdown brief. Docsy reads it once,
              then every chat after that can cite it.
            </EmptyDescription>
          </EmptyHeader>

          <EmptyContent>
            <LibraryUploadButton />
          </EmptyContent>
        </Empty>
      ) : (
        <>
          <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
            <LibraryStatusTabs
              status={status}
              query={query}
              counts={library.counts}
            />

            <LibraryFilter status={status} query={query} />
          </div>

          {/* Keyed on the filters: a new key is a new boundary, which is what
              makes the skeleton come back on every tab, search and page turn
              rather than only on the first load. */}
          <Suspense
            key={`${status}|${query}|${page}`}
            fallback={
              <LibraryTableSkeleton
                rows={Math.min(library.counts[status], LIBRARY_PAGE_SIZE) || 1}
              />
            }
          >
            <LibraryTable status={status} query={query} page={page} />
          </Suspense>
        </>
      )}
    </div>
  )
}

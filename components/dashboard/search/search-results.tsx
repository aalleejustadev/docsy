import Link from "next/link"
import { ArrowRightIcon, FileTextIcon } from "lucide-react"

import { searchPassages } from "@/lib/chat-store"
import { rangeLabel } from "@/lib/pagination"
import { searchHref, SEARCH_PAGE_SIZE } from "@/lib/search"
import { requireOrganization } from "@/lib/session"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Pager } from "@/components/dashboard/pager"
import {
  askHref,
  SearchAskCard,
} from "@/components/dashboard/search/search-ask-card"

/**
 * Matching passages — `ui-design/dashboard/light/dashboard-search-page.png`.
 *
 * Fetches its own results rather than being handed them, so the page can put
 * it behind a Suspense boundary and paint the search box and scope first.
 */
async function SearchResults({
  query,
  scope,
  page,
  chatId,
}: {
  query: string
  scope: string
  page: number
  /** The newest chat, for the "ask instead" hand-off. */
  chatId: string | null
}) {
  const organization = await requireOrganization()
  const results = await searchPassages(organization.id, query, scope, page)

  // The ask card lives in here rather than in the page so it can't promise an
  // answer "from these passages" when the search found none. Nothing matching
  // is exactly when asking is the better move, so the empty state offers it
  // too — just without claiming there are passages behind it.
  if (results.total === 0) {
    return (
      <Empty className="rounded-xl border border-dashed py-16">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <FileTextIcon />
          </EmptyMedia>
          <EmptyTitle>No passages match that</EmptyTitle>
          <EmptyDescription>
            Nothing in this scope contains those words. Try fewer of them, widen
            the scope, or put the question to Docsy — it reads for meaning
            rather than matching words.
          </EmptyDescription>
        </EmptyHeader>

        <EmptyContent>
          <Button
            size="lg"
            nativeButton={false}
            className="cursor-pointer"
            render={<Link href={askHref(query, chatId)} />}
          >
            Ask Docsy instead
            <ArrowRightIcon data-icon="inline-end" />
          </Button>
        </EmptyContent>
      </Empty>
    )
  }

  return (
    <>
      <SearchAskCard query={query} chatId={chatId} />

      <ul className="mt-6 flex flex-col gap-4">
        {results.passages.map((passage) => (
          <li
            key={passage.id}
            className="rounded-xl border bg-card px-5 py-4 transition-colors hover:border-foreground/15"
          >
            <div className="flex items-start gap-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <FileTextIcon className="size-4" />
              </span>

              <div className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-2.5 gap-y-1">
                <a
                  href={`/api/documents/${passage.documentId}`}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="truncate font-semibold hover:underline"
                >
                  {passage.documentName}
                </a>

                {/* Only rendered when the page is actually known — see the
                    comment on `page` in `searchPassages`. */}
                {passage.page !== null && (
                  <span className="font-mono text-xs text-muted-foreground">
                    p.{passage.page}
                  </span>
                )}
              </div>

              <Badge className="shrink-0 rounded-md bg-brand/15 font-mono text-[0.6875rem] tracking-wider text-brand">
                {passage.score} % match
              </Badge>
            </div>

            <p className="mt-3 text-sm/relaxed">
              {passage.clippedStart && "…"}
              {passage.segments.map((segment, index) =>
                segment.match ? (
                  <mark
                    key={index}
                    className="rounded-sm bg-brand/25 px-0.5 font-semibold text-foreground"
                  >
                    {segment.text}
                  </mark>
                ) : (
                  <span key={index}>{segment.text}</span>
                )
              )}
              {passage.clippedEnd && "…"}
            </p>
          </li>
        ))}
      </ul>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t pt-5">
        <p className="font-mono text-sm text-muted-foreground">
          {rangeLabel({
            page: results.page,
            total: results.total,
            pageSize: SEARCH_PAGE_SIZE,
            noun: "passage",
          })}
        </p>

        <Pager
          page={results.page}
          pageCount={results.pageCount}
          hrefFor={(target) => searchHref({ query, scope, page: target })}
        />
      </div>
    </>
  )
}

export { SearchResults }

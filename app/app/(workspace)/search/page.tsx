import { Suspense } from "react"
import type { Metadata } from "next"
import { SearchIcon } from "lucide-react"

import { getSearchScopes, listChats } from "@/lib/chat-store"
import { SEARCH_QUERY_MAX, toSearchScope } from "@/lib/search"
import { requireOrganization } from "@/lib/session"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import { SearchForm } from "@/components/dashboard/search/search-form"
import { SearchResultCount } from "@/components/dashboard/search/search-result-count"
import { SearchResults } from "@/components/dashboard/search/search-results"
import { SearchResultsSkeleton } from "@/components/dashboard/search/search-results-skeleton"
import { SearchScope } from "@/components/dashboard/search/search-scope"

export const metadata: Metadata = {
  title: "Search",
}

/** `?q=a&q=b` is legal in a URL and meaningless here — take the first. */
function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

/** Passage search — `ui-design/dashboard/light/dashboard-search-page.png`. */
export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const organization = await requireOrganization()
  const params = await searchParams

  const query = (first(params.q) ?? "").trim().slice(0, SEARCH_QUERY_MAX)
  const requestedPage = Number.parseInt(first(params.page) ?? "1", 10)
  const page = Number.isNaN(requestedPage) ? 1 : requestedPage

  // The scopes are the searchable corpus, not the result set — they say what
  // the next search will read, so they don't move when the query does. Cheap
  // enough to await here and let the results stream in behind them.
  const { scopes, searchableTotal, unsearchableTotal } = await getSearchScopes(
    organization.id
  )
  const scope = toSearchScope(first(params.scope), scopes)

  const chats = query ? await listChats(organization.id) : []

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-10">
      <SearchForm query={query} scope={scope} />

      {searchableTotal === 0 ? (
        <Empty className="mt-8 rounded-xl border border-dashed py-16">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <SearchIcon />
            </EmptyMedia>
            <EmptyTitle>Nothing to search yet</EmptyTitle>
            <EmptyDescription>
              {unsearchableTotal > 0
                ? `Your library holds ${unsearchableTotal} document${unsearchableTotal === 1 ? "" : "s"}, but ${unsearchableTotal === 1 ? "it is a PDF" : "they are all PDFs"}. Docsy reads those directly in a chat rather than indexing their text, so passage search can't see them. Upload a Word, text or markdown file to search across.`
                : "Upload a document to the library and its text becomes searchable here."}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <SearchScope scopes={scopes} scope={scope} query={query} />

            {query && (
              <Suspense
                key={`count|${query}|${scope}`}
                fallback={<Skeleton className="h-4 w-40" />}
              >
                <SearchResultCount query={query} scope={scope} page={page} />
              </Suspense>
            )}
          </div>

          {unsearchableTotal > 0 && (
            <p className="mt-3 text-sm text-muted-foreground">
              {unsearchableTotal} PDF{unsearchableTotal === 1 ? "" : "s"}{" "}
              {unsearchableTotal === 1 ? "isn't" : "aren't"} included — Docsy
              reads those directly in a chat rather than indexing their text.
            </p>
          )}

          {query ? (
            <div className="mt-6">
              {/* Keyed on the search, so the skeleton comes back on every new
                  query, scope change and page turn — not only the first load. */}
              <Suspense
                key={`${query}|${scope}|${page}`}
                fallback={<SearchResultsSkeleton />}
              >
                <SearchResults
                  query={query}
                  scope={scope}
                  page={page}
                  chatId={chats[0]?.id ?? null}
                />
              </Suspense>
            </div>
          ) : (
            <Empty className="mt-6 rounded-xl border border-dashed py-16">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <SearchIcon />
                </EmptyMedia>
                <EmptyTitle>Search your documents</EmptyTitle>
                <EmptyDescription>
                  Type a phrase to find the passages that mention it, across
                  every document in scope. Docsy shows you where it appears
                  before you ask about it.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </>
      )}
    </div>
  )
}

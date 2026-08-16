import { searchPassages } from "@/lib/chat-store"
import { requireOrganization } from "@/lib/session"

/**
 * "11 passages · 5 documents", right of the scope row.
 *
 * Its own component so it can sit up here in the toolbar while the results
 * stream in below it. `searchPassages` is request-cached, so this and the list
 * share one search rather than running it twice.
 */
async function SearchResultCount({
  query,
  scope,
  page,
}: {
  query: string
  scope: string
  page: number
}) {
  const organization = await requireOrganization()
  const results = await searchPassages(organization.id, query, scope, page)

  // Nothing found says itself, in the empty state under the toolbar.
  if (results.total === 0) return null

  return (
    <p className="font-mono text-sm text-muted-foreground">
      {results.total} {results.total === 1 ? "passage" : "passages"} ·{" "}
      {results.documentCount}{" "}
      {results.documentCount === 1 ? "document" : "documents"}
    </p>
  )
}

export { SearchResultCount }

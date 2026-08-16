"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { SearchIcon } from "lucide-react"

import {
  libraryHref,
  LIBRARY_QUERY_MAX,
  type LibraryStatusFilter,
} from "@/lib/library"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Spinner } from "@/components/ui/spinner"

/** Long enough to finish a word, short enough to feel like it filters live. */
const DEBOUNCE_MS = 300

/**
 * "Filter by name…" — the search field beside the status tabs.
 *
 * The field is the only stateful thing on the page; the results aren't. It
 * writes `?q=` and lets the server re-query, which is what keeps the table a
 * server component reading real rows. `replace` rather than `push` so typing
 * doesn't fill the back button with every prefix of the word.
 */
function LibraryFilter({
  status,
  query,
}: {
  /** Preserved across searches — filtering shouldn't jump you to another tab. */
  status: LibraryStatusFilter
  /** The committed search, as the server read it back off the URL. */
  query: string
}) {
  const router = useRouter()
  const [isPending, startTransition] = React.useTransition()

  /** What's in the field right now. */
  const [value, setValue] = React.useState(query)
  /** The `query` this field has already reconciled itself against. */
  const [seen, setSeen] = React.useState(query)
  /** The last search this field sent to the URL — ahead of `seen` in flight. */
  const [sent, setSent] = React.useState(query)

  // A search that arrives without this field having asked for it came from
  // somewhere else — a back or forward navigation, or a shared link — and the
  // URL wins. Anything this field sent is ignored on the way back, which is
  // what stops a slow response from restoring a search already edited past.
  //
  // Adjusted during render rather than in an effect, so the field never paints
  // the stale search first, and keeps focus, which remounting on a `key` would
  // not.
  if (query !== seen) {
    setSeen(query)

    if (query !== sent) {
      setSent(query)
      setValue(query)
    }
  }

  React.useEffect(() => {
    const next = value.trim()

    if (next === sent) return

    const timer = setTimeout(() => {
      setSent(next)

      startTransition(() => {
        router.replace(libraryHref({ status, query: next }), { scroll: false })
      })
    }, DEBOUNCE_MS)

    return () => clearTimeout(timer)
  }, [value, sent, status, router])

  return (
    <InputGroup className="h-10 w-full rounded-lg sm:w-72">
      <InputGroupAddon>
        <SearchIcon />
      </InputGroupAddon>

      <InputGroupInput
        type="search"
        value={value}
        maxLength={LIBRARY_QUERY_MAX}
        placeholder="Filter by name…"
        aria-label="Filter documents by name"
        onChange={(event) => setValue(event.target.value)}
      />

      {isPending && (
        <InputGroupAddon align="inline-end">
          <Spinner className="size-4" />
        </InputGroupAddon>
      )}
    </InputGroup>
  )
}

export { LibraryFilter }

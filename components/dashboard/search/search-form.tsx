"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { SearchIcon } from "lucide-react"

import { searchHref, SEARCH_QUERY_MAX } from "@/lib/search"
import { Button } from "@/components/ui/button"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Spinner } from "@/components/ui/spinner"

/**
 * The search box — `ui-design/dashboard/light/dashboard-search-page.png`.
 *
 * A real form, submitted on Enter or by the button. Unlike the library's
 * filter this doesn't search as you type: a passage search reads every
 * document in the workspace, which is too much work to spend on a half-typed
 * word, and the reference puts a Search button there for exactly that reason.
 *
 * The scope rides along so refining a query doesn't silently widen it back to
 * every document. Page doesn't — a new query starts at the first page.
 */
function SearchForm({ query, scope }: { query: string; scope: string }) {
  const router = useRouter()
  const [value, setValue] = React.useState(query)
  const [isPending, startTransition] = React.useTransition()

  // The URL wins on a back/forward navigation or a shared link. Adjusted
  // during render so the field never paints the previous search first.
  const [seen, setSeen] = React.useState(query)
  if (query !== seen) {
    setSeen(query)
    setValue(query)
  }

  return (
    <form
      role="search"
      onSubmit={(event) => {
        event.preventDefault()
        startTransition(() => {
          router.push(searchHref({ query: value, scope }))
        })
      }}
    >
      <InputGroup className="h-14 rounded-xl pr-1.5 pl-1.5 shadow-sm">
        <InputGroupAddon className="pl-2.5">
          <SearchIcon className="size-5 text-muted-foreground" />
        </InputGroupAddon>

        <InputGroupInput
          autoFocus
          name="q"
          value={value}
          maxLength={SEARCH_QUERY_MAX}
          placeholder="Search across your documents…"
          aria-label="Search across your documents"
          onChange={(event) => setValue(event.target.value)}
          className="text-base md:text-base"
        />

        <InputGroupAddon align="inline-end">
          <Button
            type="submit"
            size="lg"
            disabled={isPending || value.trim().length === 0}
            className="h-11 cursor-pointer px-5"
          >
            {isPending && <Spinner data-icon="inline-start" />}
            Search
          </Button>
        </InputGroupAddon>
      </InputGroup>
    </form>
  )
}

export { SearchForm }

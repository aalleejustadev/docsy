"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { PlusIcon, SearchIcon } from "lucide-react"

import { adminUsersHref, ADMIN_QUERY_MAX, ADMIN_TABS } from "@/lib/admin"
import { Button } from "@/components/ui/button"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Spinner } from "@/components/ui/spinner"

/** Long enough to finish a word, short enough to feel like it filters live. */
const DEBOUNCE_MS = 300

/** The "Add user" tab, once it exists — where Create user will point. */
const addUserTab = ADMIN_TABS.find((tab) => tab.label === "Add user")!

/**
 * "Search users…" and the Create user button —
 * `ui-design/dashboard/light/admin-users-page.png`.
 *
 * The field is the only stateful thing on the page; the results aren't. It
 * writes `?q=` and lets the server re-query, which keeps the table a server
 * component reading real rows. Same reconciliation as the library's filter: a
 * search arriving that this field didn't send came from a back/forward
 * navigation or a shared link, and the URL wins.
 */
function AdminUsersFilter({ query }: { query: string }) {
  const router = useRouter()
  const [isPending, startTransition] = React.useTransition()

  /** What's in the field right now. */
  const [value, setValue] = React.useState(query)
  /** The `query` this field has already reconciled itself against. */
  const [seen, setSeen] = React.useState(query)
  /** The last search this field sent to the URL — ahead of `seen` in flight. */
  const [sent, setSent] = React.useState(query)

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
        router.replace(adminUsersHref({ query: next }), { scroll: false })
      })
    }, DEBOUNCE_MS)

    return () => clearTimeout(timer)
  }, [value, sent, router])

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <InputGroup className="h-10 w-full rounded-lg sm:w-100">
        <InputGroupAddon>
          <SearchIcon />
        </InputGroupAddon>

        <InputGroupInput
          type="search"
          placeholder="Search users…"
          aria-label="Search users by name or email"
          maxLength={ADMIN_QUERY_MAX}
          value={value}
          onChange={(event) => setValue(event.target.value)}
        />

        {isPending && (
          <InputGroupAddon align="inline-end">
            <Spinner className="size-4" />
          </InputGroupAddon>
        )}
      </InputGroup>

      <Button
        size="lg"
        nativeButton={false}
        className="cursor-pointer px-4"
        render={<Link href={addUserTab.href} />}
      >
        <PlusIcon data-icon="inline-start" />
        Create user
      </Button>
    </div>
  )
}

export { AdminUsersFilter }

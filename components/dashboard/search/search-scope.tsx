import Link from "next/link"

import { searchHref, type SearchScopeView } from "@/lib/search"
import { cn } from "@/lib/utils"
import { badgeVariants } from "@/components/ui/badge"

/**
 * "Scope · All documents · 42 · DOCX · 6" — what the next search will read.
 *
 * The reference shows named collections here. There are none in the schema, so
 * these are the real thing a document can be grouped by today: its format.
 *
 * Links rather than a toggle group, because each scope is a different URL with
 * its own server-rendered results.
 */
function SearchScope({
  scopes,
  scope,
  query,
}: {
  scopes: SearchScopeView[]
  /** The active scope's value. */
  scope: string
  /** Carried through, so changing scope re-runs the same search. */
  query: string
}) {
  return (
    <nav
      aria-label="Search scope"
      className="flex flex-wrap items-center gap-2"
    >
      <span className="text-sm text-muted-foreground">Scope</span>

      {scopes.map((option) => {
        const isActive = option.value === scope

        return (
          <Link
            key={option.value}
            href={searchHref({ query, scope: option.value })}
            aria-current={isActive ? "true" : undefined}
            className={cn(
              badgeVariants({ variant: "outline" }),
              "h-8 gap-1.5 px-3 text-sm transition-colors hover:bg-muted",
              isActive &&
                "border-brand/40 bg-brand/10 text-brand hover:bg-brand/15"
            )}
          >
            {option.label}
            <span
              aria-hidden
              className={cn(
                isActive ? "text-brand/60" : "text-muted-foreground"
              )}
            >
              ·
            </span>
            <span className="tabular-nums">{option.count}</span>
          </Link>
        )
      })}
    </nav>
  )
}

export { SearchScope }

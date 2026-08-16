import Link from "next/link"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"

import { pageNumbers } from "@/lib/pagination"
import { Button } from "@/components/ui/button"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
} from "@/components/ui/pagination"

/**
 * One pager control. `href` being null is the "there's no such page" case —
 * a disabled button, rather than a link that goes nowhere.
 */
function PageLink({
  href,
  isActive,
  label,
  className,
  children,
}: {
  href: string | null
  isActive?: boolean
  label?: string
  className?: string
  children: React.ReactNode
}) {
  if (!href) {
    return (
      <Button variant="outline" size="lg" disabled className={className}>
        {children}
      </Button>
    )
  }

  return (
    <Button
      variant={isActive ? "default" : "outline"}
      size="lg"
      nativeButton={false}
      className={className}
      render={
        <Link
          href={href}
          scroll={false}
          aria-label={label}
          aria-current={isActive ? "page" : undefined}
        />
      }
    >
      {children}
    </Button>
  )
}

/**
 * Previous · 1 2 3 · Next, under a paged list.
 *
 * Real links, so a page can be bookmarked and opened in a new tab. The caller
 * supplies `hrefFor` because each list keeps its own filters in the query
 * string and the pager has no business knowing what they are.
 *
 * `scroll={false}` keeps the list where it is instead of jumping the reader
 * back to the heading on every page turn.
 */
function Pager({
  page,
  pageCount,
  hrefFor,
}: {
  page: number
  pageCount: number
  hrefFor: (page: number) => string
}) {
  if (pageCount <= 1) return null

  return (
    <Pagination className="mx-0 w-auto justify-end">
      <PaginationContent className="gap-1">
        <PaginationItem>
          <PageLink
            href={page > 1 ? hrefFor(page - 1) : null}
            label="Previous page"
            className="pl-1.5!"
          >
            <ChevronLeftIcon data-icon="inline-start" />
            <span className="hidden sm:block">Previous</span>
          </PageLink>
        </PaginationItem>

        {pageNumbers(page, pageCount).map((number, index) =>
          number === "ellipsis" ? (
            <PaginationItem key={`ellipsis-${index}`}>
              <PaginationEllipsis className="size-9" />
            </PaginationItem>
          ) : (
            <PaginationItem key={number}>
              <PageLink
                href={hrefFor(number)}
                isActive={number === page}
                label={`Page ${number}`}
                className="w-9 tabular-nums"
              >
                {number}
              </PageLink>
            </PaginationItem>
          )
        )}

        <PaginationItem>
          <PageLink
            href={page < pageCount ? hrefFor(page + 1) : null}
            label="Next page"
            className="pr-1.5!"
          >
            <span className="hidden sm:block">Next</span>
            <ChevronRightIcon data-icon="inline-end" />
          </PageLink>
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}

export { Pager }

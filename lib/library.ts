import type { DocumentStatusView, LibraryDocumentView } from "@/lib/chat"
import { APP_ROOT } from "@/lib/dashboard-nav"

/**
 * The library page's URL contract and the small pieces of presentation that
 * both the server page and its client controls need.
 *
 * Filtering, searching and paging all live in the query string rather than in
 * component state: the page stays a server component reading real rows, and a
 * filtered view can be linked to, reloaded and shared.
 */

export const LIBRARY_ROUTE = `${APP_ROOT}/library`

/** Rows per page — six, as `dashboard-library-page.png` shows. */
export const LIBRARY_PAGE_SIZE = 6

/** Longer than this and the field is being pasted into, not typed in. */
export const LIBRARY_QUERY_MAX = 100

export type LibraryStatusFilter = "all" | "indexed" | "indexing" | "failed"

/**
 * The tab strip, in the order it's rendered. `status: null` is the "All" tab —
 * it doesn't narrow the query at all.
 */
export const libraryStatusFilters: {
  value: LibraryStatusFilter
  label: string
  status: DocumentStatusView | null
}[] = [
  { value: "all", label: "All", status: null },
  { value: "indexed", label: "Indexed", status: "READY" },
  { value: "indexing", label: "Indexing", status: "PROCESSING" },
  { value: "failed", label: "Failed", status: "FAILED" },
]

/** Anything unrecognised in `?status=` falls back to the unfiltered view. */
export function toLibraryStatusFilter(value?: string): LibraryStatusFilter {
  return libraryStatusFilters.some((filter) => filter.value === value)
    ? (value as LibraryStatusFilter)
    : "all"
}

/**
 * Builds a library URL, leaving defaults out so the plain route stays clean.
 *
 * Page is deliberately opt-in: a caller changing the status or the search
 * omits it, which is what resets the reader to the first page.
 */
export function libraryHref({
  status = "all",
  query = "",
  page = 1,
}: {
  status?: LibraryStatusFilter
  query?: string
  page?: number
} = {}) {
  const params = new URLSearchParams()

  if (status !== "all") params.set("status", status)
  if (query.trim()) params.set("q", query.trim())
  if (page > 1) params.set("page", String(page))

  const search = params.toString()

  return search ? `${LIBRARY_ROUTE}?${search}` : LIBRARY_ROUTE
}

/**
 * The page numbers to render, collapsing the middle once there are too many
 * to sit in a row. Always keeps the first, the last and the current page's
 * neighbours, so the reader can always step one page at a time or jump to
 * either end.
 */
export function libraryPageNumbers(
  page: number,
  pageCount: number
): (number | "ellipsis")[] {
  if (pageCount <= 7) {
    return Array.from({ length: pageCount }, (_, index) => index + 1)
  }

  const wanted = [1, page - 1, page, page + 1, pageCount]
    .filter((number) => number >= 1 && number <= pageCount)
    .sort((a, b) => a - b)

  const numbers: (number | "ellipsis")[] = []
  let previous = 0

  for (const number of wanted) {
    if (number === previous) continue
    if (previous && number - previous > 1) numbers.push("ellipsis")

    numbers.push(number)
    previous = number
  }

  return numbers
}

/**
 * "2h ago", "5d ago" — the compact ages in the Added column.
 *
 * `date-fns` would say "2 hours"; the reference is tighter than that and the
 * column is monospaced, so the unit is a single letter.
 */
export function shortAge(date: Date, now: Date = new Date()) {
  const seconds = Math.max(0, (now.getTime() - date.getTime()) / 1000)
  const minutes = seconds / 60
  const hours = minutes / 60
  const days = hours / 24

  if (seconds < 60) return "just now"
  if (minutes < 60) return `${Math.floor(minutes)}m ago`
  if (hours < 24) return `${Math.floor(hours)}h ago`
  if (days < 7) return `${Math.floor(days)}d ago`
  if (days < 30) return `${Math.floor(days / 7)}w ago`
  if (days < 365) return `${Math.floor(days / 30)}mo ago`

  return `${Math.floor(days / 365)}y ago`
}

/** A row in the library table — the picker's view plus the extra columns. */
export type LibraryRowView = LibraryDocumentView & {
  /** ISO timestamp of the upload, for the Added column. */
  createdAt: string
  /** Chats citing it — what deleting the document would leave behind. */
  chatCount: number
}

/**
 * The numbers framing the table.
 *
 * Read separately from the rows so the toolbar can paint as soon as they land
 * — the rows stream in behind it under their own Suspense boundary.
 */
export type LibraryCountsView = {
  /** Every document in the workspace, ignoring both filters. */
  libraryTotal: number
  /** Counts per tab, narrowed by the name filter but not by the active tab. */
  counts: Record<LibraryStatusFilter, number>
}

/** One page of rows, matching both filters. */
export type LibraryRowsView = {
  documents: LibraryRowView[]
  /** Rows matching both filters — what the pager counts through. */
  total: number
  /** Clamped into range, so `?page=99` lands on the last page. */
  page: number
  pageCount: number
}

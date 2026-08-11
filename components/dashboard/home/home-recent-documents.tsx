import Link from "next/link"
import { FileTextIcon } from "lucide-react"

import { APP_ROOT } from "@/lib/dashboard-nav"
import { cn } from "@/lib/utils"
import { HomeSection } from "@/components/dashboard/home/home-section"

/**
 * Indexing state travels as a dot *and* a word: the dot alone would be colour
 * on its own, and the amber sits under 3:1 against the card, so the label
 * carries the meaning in text ink.
 */
const STATUS = {
  indexed: { label: "Indexed", dot: "bg-brand" },
  indexing: { label: "Indexing…", dot: "bg-muted-foreground" },
} as const

/** Design copy — real uploads replace this once the library is wired up. */
const RECENT_DOCUMENTS = [
  {
    id: "q3-vendor-agreement",
    name: "Q3_Vendor_Agreement.pdf",
    meta: "2.4 MB · 18 pages",
    status: "indexed",
  },
  {
    id: "master-services-agreement",
    name: "Master_Services_Agreement.docx",
    meta: "880 KB · 32 pages",
    status: "indexing",
  },
  {
    id: "fy25-financials",
    name: "FY25_Financials.xlsx",
    meta: "1.1 MB · 6 sheets",
    status: "indexed",
  },
] satisfies {
  id: string
  name: string
  meta: string
  status: keyof typeof STATUS
}[]

/** Right column of the home page — `dashboard-home.png`. */
function HomeRecentDocuments() {
  return (
    <HomeSection
      title="Recent documents"
      action={{ href: `${APP_ROOT}/library`, label: "Library" }}
    >
      {RECENT_DOCUMENTS.map((document) => {
        const status = STATUS[document.status]

        return (
          <Link
            key={document.id}
            href={`${APP_ROOT}/library/${document.id}`}
            className="flex items-center gap-3 p-4 transition-colors hover:bg-accent/50"
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <FileTextIcon className="size-4" />
            </span>

            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold">
                {document.name}
              </span>
              <span className="block truncate text-sm text-muted-foreground">
                {document.meta}
              </span>
            </span>

            <span className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
              <span
                aria-hidden
                className={cn("size-1.5 rounded-full", status.dot)}
              />
              {status.label}
            </span>
          </Link>
        )
      })}
    </HomeSection>
  )
}

export { HomeRecentDocuments }

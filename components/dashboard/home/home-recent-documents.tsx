import { FileTextIcon } from "lucide-react"

import type { DocumentStatusView } from "@/lib/chat"
import { listRecentDocuments } from "@/lib/chat-store"
import { requireOrganization } from "@/lib/session"
import { cn } from "@/lib/utils"
import { HomeSection } from "@/components/dashboard/home/home-section"

/**
 * Indexing state travels as a dot *and* a word: the dot alone would be colour
 * on its own, and the amber sits under 3:1 against the card, so the label
 * carries the meaning in text ink.
 */
const STATUS: Record<DocumentStatusView, { label: string; dot: string }> = {
  READY: { label: "Indexed", dot: "bg-brand" },
  PROCESSING: { label: "Indexing…", dot: "bg-muted-foreground" },
  FAILED: { label: "Unreadable", dot: "bg-destructive" },
}

/** Right column of the home page — `dashboard-home.png`. */
async function HomeRecentDocuments() {
  const organization = await requireOrganization()
  const documents = await listRecentDocuments(organization.id)

  return (
    <HomeSection title="Recent documents">
      {documents.length === 0 ? (
        <p className="p-4 text-sm text-muted-foreground">
          Nothing uploaded yet. Start a chat and drop a document in.
        </p>
      ) : (
        documents.map((document) => {
          const status = STATUS[document.status]

          return (
            // Opens the stored file itself. There's no library page to link to
            // yet, and the document is the useful destination regardless.
            <a
              key={document.id}
              href={`/api/documents/${document.id}`}
              target="_blank"
              rel="noreferrer noopener"
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
            </a>
          )
        })
      )}
    </HomeSection>
  )
}

export { HomeRecentDocuments }

import { FileTextIcon } from "lucide-react"

import type { UsageDocument } from "@/lib/usage"

/**
 * "Most-questioned documents" — `ui-design/dashboard/light/usage-page.png`.
 *
 * The bar is a share of the top document rather than of the total, so the
 * leader always fills the track and the rest read against it. Each row carries
 * its own number, which is what lets the bar stay a light tint.
 */
function UsageDocuments({ documents }: { documents: UsageDocument[] }) {
  if (documents.length === 0) {
    return (
      <p className="px-5 py-6 text-sm text-muted-foreground">
        Nothing yet. Once Docsy cites a document in an answer, it shows up here.
      </p>
    )
  }

  const busiest = documents[0].questions

  return (
    <ul className="divide-y">
      {documents.map((document) => (
        <li key={document.id} className="flex items-center gap-4 px-5 py-3.5">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <FileTextIcon className="size-4" />
          </span>

          <a
            href={`/api/documents/${document.id}`}
            target="_blank"
            rel="noreferrer noopener"
            className="w-56 shrink-0 truncate text-sm font-medium hover:underline"
          >
            {document.name}
          </a>

          {/* Presentational: the count beside it is the accessible value. */}
          <span
            aria-hidden
            className="hidden h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-brand/15 sm:block"
          >
            <span
              className="block h-full rounded-full bg-brand"
              style={{
                width: `${Math.max(4, Math.round((document.questions / busiest) * 100))}%`,
              }}
            />
          </span>

          <span className="ml-auto shrink-0 font-mono text-sm text-muted-foreground tabular-nums">
            {document.questions}
          </span>
        </li>
      ))}
    </ul>
  )
}

export { UsageDocuments }

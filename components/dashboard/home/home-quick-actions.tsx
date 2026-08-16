import Link from "next/link"
import { PlusIcon, UploadIcon } from "lucide-react"

import { CHATS_ROUTE } from "@/lib/chat"

/**
 * The two things a new session starts with — `dashboard-home.png`, with the
 * upload card's hover state from `upload-doc__hover-state.png`.
 *
 * Both lead to the same screen: a chat can't start without a document, so
 * "upload" and "new chat" are the same first step from different angles.
 */
function HomeQuickActions() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Link
        href={CHATS_ROUTE}
        className="flex cursor-pointer items-center gap-4 rounded-xl border bg-card p-5 text-left transition-colors hover:bg-accent/50"
      >
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <PlusIcon className="size-5" />
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="font-semibold">Start a new chat</span>
          <span className="truncate text-sm text-muted-foreground">
            Ask across your library
          </span>
        </span>
      </Link>

      <Link
        href={CHATS_ROUTE}
        className="group flex cursor-pointer items-center gap-4 rounded-xl border border-dashed bg-surface p-5 text-left transition-colors hover:border-brand"
      >
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-brand">
          <UploadIcon className="size-5" />
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="font-semibold">Upload documents</span>
          <span className="truncate text-sm text-muted-foreground">
            PDF, Word, slides, scans
          </span>
        </span>
      </Link>
    </div>
  )
}

export { HomeQuickActions }

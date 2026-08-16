import Link from "next/link"
import { ArrowRightIcon } from "lucide-react"

import { chatQuestionHref, CHATS_ROUTE } from "@/lib/chat"
import { DocsyMark } from "@/components/brand/docsy-logo"

/**
 * "Ask Docsy instead of scanning results" — the way out of a results list and
 * into an answer.
 *
 * Hands the query to a chat as `?q=`, which fills the composer rather than
 * sending it, so the developer still sees the question before it runs. With no
 * chat to land in it opens a new one, where the question is typed against
 * whichever documents they pick.
 */
/**
 * Where the card goes. With a chat to land in, the question is asked on
 * arrival; without one there is nothing to ask against yet, so it opens a new
 * chat where documents get picked first.
 */
function askHref(query: string, chatId: string | null) {
  return chatId
    ? chatQuestionHref(chatId, query, { autoAsk: true })
    : CHATS_ROUTE
}

function SearchAskCard({
  query,
  chatId,
}: {
  query: string
  /** The newest chat, or null when the workspace has none yet. */
  chatId: string | null
}) {
  return (
    <Link
      href={askHref(query, chatId)}
      className="group flex items-center gap-4 rounded-xl border border-dashed bg-surface px-5 py-4 transition-colors hover:border-brand/50 hover:bg-accent/40"
    >
      {/* The mark carries its own dark tile, so it doesn't need a wrapper. */}
      <DocsyMark className="size-10 shrink-0" />

      <span className="min-w-0 flex-1">
        <span className="block font-semibold">
          Ask Docsy instead of scanning results
        </span>
        <span className="block truncate text-sm text-muted-foreground">
          Get one cited answer synthesized from these passages.
        </span>
      </span>

      <ArrowRightIcon className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </Link>
  )
}

export { askHref, SearchAskCard }

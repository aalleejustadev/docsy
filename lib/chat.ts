import { APP_ROOT } from "@/lib/dashboard-nav"

/** A new, empty chat. The sidebar's "New chat" button and nav item both land here. */
export const CHATS_ROUTE = `${APP_ROOT}/chats`

export function chatRoute(chatId: string) {
  return `${CHATS_ROUTE}/${chatId}`
}

/**
 * Carries a question into a chat.
 *
 * Without `autoAsk` the question lands in the composer and waits for Enter —
 * what the command palette wants, where the row is a jump and the developer
 * may still be composing the thought. With it, the chat asks on arrival: the
 * search page's card promises "one cited answer", and making someone press
 * Enter to collect on that is a step that buys them nothing.
 *
 * Both are read once on mount and then stripped from the URL, so a reload
 * never re-asks.
 */
export function chatQuestionHref(
  chatId: string,
  question: string,
  { autoAsk = false }: { autoAsk?: boolean } = {}
) {
  const params = new URLSearchParams({ q: question })

  if (autoAsk) params.set("ask", "1")

  return `${chatRoute(chatId)}?${params}`
}

/** What the drop zone accepts — `ui-design/dashboard/light/chat-main.png`. */
export const DOCUMENT_ACCEPT = ".pdf,.docx,.txt,.md"

export const DOCUMENT_FORMATS_LABEL = "PDF, Word, text, markdown · up to 15 MB"

/** One chat can only hold so much context before answers get vague. */
export const MAX_DOCUMENTS_PER_CHAT = 20

/** Plan quota shown in the composer footer — `chat-page-chat.png`. */
export const MONTHLY_QUESTION_LIMIT = 50

/** "2.4 MB", "880 KB" — shared so uploads and library rows read the same. */
export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/**
 * Flattens Markdown to the words a reader would say out loud — for previews
 * and other places an answer is shown as one line of plain text.
 *
 * Deliberately lossy: structure is dropped rather than approximated, because
 * a one-line summary has nowhere to put a heading or a list.
 */
export function toPlainText(markdown: string) {
  return (
    markdown
      // Fenced code goes entirely; a snippet says nothing useful in a preview.
      .replace(/```[\s\S]*?```/g, " ")
      .replace(/`([^`]+)`/g, "$1")
      // Links and images keep their label, not their target.
      .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
      // Citation markers, including the `[1:0]` passage form. The optional
      // leading space goes with them, so "a claim [1]." doesn't become
      // "a claim ." once the marker is gone.
      .replace(/\s?\[\d+(?::\d+)?\]/g, "")
      // Headings, quotes and bullets at the start of a line.
      .replace(/^\s{0,3}(?:#{1,6}|>|[-*+])\s+/gm, "")
      .replace(/^\s{0,3}\d+\.\s+/gm, "")
      // Horizontal rules and table scaffolding.
      .replace(/^\s{0,3}(?:[-*_]\s*){3,}$/gm, " ")
      .replace(/\|/g, " ")
      // Emphasis, bold first so `**x**` doesn't leave a stray asterisk.
      .replace(/(\*\*|__)(.*?)\1/g, "$2")
      .replace(/(\*|_)(?=\S)(.*?)(?<=\S)\1/g, "$2")
      .replace(/\s+/g, " ")
      .trim()
  )
}

export type DocumentStatusView = "PROCESSING" | "READY" | "FAILED"

export type LibraryDocumentView = {
  id: string
  name: string
  /** Size and shape, e.g. "2.4 MB · 18 pages". */
  meta: string
  /** Extension pill on the right of the row. */
  format: string
  status: DocumentStatusView
}

/** One passage Claude quoted, with the document text either side of it. */
export type ChatSourcePassage = {
  /** The exact wording cited — highlighted in the source reader. */
  text: string
  /**
   * Surrounding text, so the quote can be read in context. Null for PDFs,
   * whose text we never extract — Claude reads those natively.
   */
  before: string | null
  after: string | null
}

/** One resolved citation behind an answer's `[n]` marker. */
export type ChatSource = {
  index: number
  /** Null on answers written before documents were linked to citations. */
  documentId: string | null
  document: string
  /** Null for formats without pages, like markdown or a plain-text brief. */
  page: number | null
  /** Every area of this source the answer leaned on, in the order cited. */
  passages: ChatSourcePassage[]
}

/** How an answer was rated, or null while nobody has said. */
export type MessageFeedbackView = "UP" | "DOWN" | null

export type ChatMessageView = {
  id: string
  role: "user" | "assistant"
  content: string
  sources: ChatSource[]
  feedback: MessageFeedbackView
}

/** A row in the sidebar's history, and on the home page's recent list. */
export type ChatSummary = {
  id: string
  title: string
  /** ISO timestamp of the last turn, for "2h" style ages. */
  updatedAt: string
  /** Opening of the latest answer, for the home page's two-line rows. */
  preview: string | null
}

/** A document attached to a chat, as the composer's scope picker lists it. */
export type ChatDocumentView = {
  id: string
  name: string
}

export type ChatDetail = {
  id: string
  title: string
  /** In citation order, which is the order they go to Claude. */
  documents: ChatDocumentView[]
  /** Workspace-wide questions this month — what the plan allowance counts. */
  questionsThisMonth: number
  messages: ChatMessageView[]
  /**
   * True when the last turn is still waiting on Claude — either the seeded
   * brief analysis or a follow-up whose answer never landed. The conversation
   * view uses it to kick off streaming on load.
   */
  pendingAnswer: boolean
}

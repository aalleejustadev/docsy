import { APP_ROOT } from "@/lib/dashboard-nav"

/** A new, empty chat. The sidebar's "New chat" button and nav item both land here. */
export const CHATS_ROUTE = `${APP_ROOT}/chats`

export function chatRoute(chatId: string) {
  return `${CHATS_ROUTE}/${chatId}`
}

/** What the drop zone accepts — `ui-design/dashboard/light/chat-main.png`. */
export const DOCUMENT_ACCEPT = [
  ".pdf",
  ".doc",
  ".docx",
  ".rtf",
  ".txt",
  ".md",
  ".ppt",
  ".pptx",
  ".xls",
  ".xlsx",
  ".csv",
  ".png",
  ".jpg",
  ".jpeg",
  ".tif",
  ".tiff",
].join(",")

export const DOCUMENT_FORMATS_LABEL =
  "PDF, Word, slides, spreadsheets, scans · 40+ formats"

/** One chat can only hold so much context before answers get vague. */
export const MAX_DOCUMENTS_PER_CHAT = 20

/** Plan quota shown in the composer footer — `chat-page-chat.png`. */
export const MONTHLY_QUESTION_LIMIT = 50

export type ChatSource = {
  /** Citation index, matching the `[n]` markers in the answer. */
  index: number
  document: string
  page: number
}

export type ChatMessage = {
  id: string
  role: "user" | "assistant"
  content: string
  sources?: ChatSource[]
}

export type Chat = {
  id: string
  title: string
  /** Opening line of the last answer, for the home page's list. */
  reply: string
  /** Relative age, e.g. "2h". */
  age: string
  /** Documents attached to the chat. */
  documents: number
  /** Questions asked so far, against `MONTHLY_QUESTION_LIMIT`. */
  questionsUsed: number
  messages: ChatMessage[]
}

/**
 * Design copy — real chats replace this once they're stored. Titles and the
 * order match `ui-design/dashboard/light/chat-sidebar.png`; the first chat's
 * exchange is the one in `chat-page-chat.png`.
 */
export const recentChats: Chat[] = [
  {
    id: "termination-terms",
    title: "Termination terms across contracts",
    reply: "Either party may terminate with 60 days'…",
    age: "2h",
    documents: 3,
    questionsUsed: 18,
    messages: [
      {
        id: "termination-terms-1",
        role: "user",
        content:
          "What's the termination notice period, and when can we terminate immediately?",
      },
      {
        id: "termination-terms-2",
        role: "assistant",
        content:
          "Either party may terminate this agreement for convenience with 60 days' prior written notice [1]. Termination may also occur immediately where there is a material breach that remains uncured 30 days after written notice [2].",
        sources: [
          { index: 1, document: "Q3_Vendor_Agreement.pdf", page: 12 },
          { index: 2, document: "Master_Services_Agreement.docx", page: 8 },
        ],
      },
    ],
  },
  {
    id: "q3-revenue",
    title: "Q3 revenue with page references",
    reply: "Revenue rose 14% to $23.8M, per p.4…",
    age: "1d",
    documents: 2,
    questionsUsed: 9,
    messages: [
      {
        id: "q3-revenue-1",
        role: "user",
        content: "What was Q3 revenue, and what drove the change?",
      },
      {
        id: "q3-revenue-2",
        role: "assistant",
        content:
          "Q3 revenue rose 14% year over year to $23.8M [1]. The report attributes most of the increase to enterprise renewals, which grew 21% against a flat self-serve segment [2].",
        sources: [
          { index: 1, document: "Q3_Financial_Report.pdf", page: 4 },
          { index: 2, document: "Q3_Financial_Report.pdf", page: 11 },
        ],
      },
    ],
  },
  {
    id: "liability-caps",
    title: "Liability caps and indemnities",
    reply: "Liability is capped at fees paid in the prior…",
    age: "3d",
    documents: 4,
    questionsUsed: 6,
    messages: [
      {
        id: "liability-caps-1",
        role: "user",
        content: "How is liability capped, and what falls outside the cap?",
      },
      {
        id: "liability-caps-2",
        role: "assistant",
        content:
          "Liability is capped at the fees paid in the twelve months preceding the claim [1]. The cap does not apply to indemnification obligations, breaches of confidentiality, or wilful misconduct [2].",
        sources: [
          { index: 1, document: "Master_Services_Agreement.docx", page: 14 },
          { index: 2, document: "Master_Services_Agreement.docx", page: 15 },
        ],
      },
    ],
  },
  {
    id: "renewal-clauses",
    title: "Renewal & auto-renewal clauses",
    reply: "Terms auto-renew for successive 12-month…",
    age: "5d",
    documents: 3,
    questionsUsed: 4,
    messages: [
      {
        id: "renewal-clauses-1",
        role: "user",
        content:
          "Do any of these contracts auto-renew, and what's the opt-out window?",
      },
      {
        id: "renewal-clauses-2",
        role: "assistant",
        content:
          "Two of the three auto-renew for successive 12-month terms unless either party gives notice [1]. The opt-out window differs: 30 days before the renewal date in one, 90 days in the other [2].",
        sources: [
          { index: 1, document: "Q3_Vendor_Agreement.pdf", page: 3 },
          { index: 2, document: "Reseller_Agreement.pdf", page: 6 },
        ],
      },
    ],
  },
  {
    id: "data-processing",
    title: "Data processing obligations",
    reply: "Sub-processors require 30 days' notice…",
    age: "1w",
    documents: 2,
    questionsUsed: 3,
    messages: [
      {
        id: "data-processing-1",
        role: "user",
        content:
          "What are our obligations around sub-processors and breach notice?",
      },
      {
        id: "data-processing-2",
        role: "assistant",
        content:
          "New sub-processors require 30 days' advance written notice, and the customer may object within that window [1]. Personal data breaches must be reported without undue delay and in any event within 72 hours of becoming aware [2].",
        sources: [
          { index: 1, document: "Data_Processing_Addendum.pdf", page: 5 },
          { index: 2, document: "Data_Processing_Addendum.pdf", page: 9 },
        ],
      },
    ],
  },
]

export function findChat(chatId: string) {
  return recentChats.find((chat) => chat.id === chatId)
}

/**
 * The chat a `/app/chats/...` path is showing, or `undefined` on `/app/chats`
 * itself. Lets the header name the chat without threading params through the
 * layout.
 */
export function chatFromPathname(pathname: string) {
  if (!pathname.startsWith(`${CHATS_ROUTE}/`)) return undefined

  return findChat(pathname.slice(CHATS_ROUTE.length + 1))
}

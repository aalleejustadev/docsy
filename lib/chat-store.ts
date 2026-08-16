import { cache } from "react"

import { db } from "@/lib/db"
import { MONTHLY_QUESTION_LIMIT, toPlainText } from "@/lib/chat"
import type {
  ChatDetail,
  ChatMessageView,
  ChatSource,
  ChatSummary,
  LibraryDocumentView,
  MessageFeedbackView,
} from "@/lib/chat"
import type { DashboardNavCounts } from "@/lib/dashboard-nav"
import { documentMeta, type DocumentPayload } from "@/lib/documents"
import {
  LIBRARY_PAGE_SIZE,
  libraryStatusFilters,
  type LibraryCountsView,
  type LibraryRowsView,
  type LibraryStatusFilter,
} from "@/lib/library"
import { clampPage } from "@/lib/pagination"
import {
  usagePeriod,
  USAGE_CHART_DAYS,
  USAGE_TOP_DOCUMENTS,
  type UsageView,
} from "@/lib/usage"
import {
  scorePassage,
  SEARCH_PAGE_SIZE,
  searchStems,
  splitPassages,
  type SearchPassageView,
  type SearchResultsView,
  type SearchScopeView,
} from "@/lib/search"

/**
 * Chat and document reads/writes. Server-only.
 *
 * Every query is scoped by `organizationId` — a workspace is the tenancy
 * boundary, so a chat id alone must never be enough to read someone else's
 * documents.
 */

/**
 * Questions asked across the workspace this calendar month.
 *
 * This is the figure the plan allowance is measured against, so both the home
 * page and the composer read it from here rather than counting their own way.
 * The seeded brief-analysis request is excluded — the developer didn't ask it.
 */
export async function countQuestionsThisMonth(organizationId: string) {
  const now = new Date()

  return db.message.count({
    where: {
      role: "USER",
      hidden: false,
      createdAt: { gte: new Date(now.getFullYear(), now.getMonth(), 1) },
      chat: { organizationId },
    },
  })
}

/** Sidebar history, newest conversation first. */
export async function listChats(
  organizationId: string
): Promise<ChatSummary[]> {
  const chats = await db.chat.findMany({
    where: { organizationId },
    orderBy: { updatedAt: "desc" },
    take: 50,
    select: {
      id: true,
      title: true,
      updatedAt: true,
      messages: {
        where: { role: "ASSISTANT" },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { content: true },
      },
    },
  })

  return chats.map((chat) => ({
    id: chat.id,
    title: chat.title,
    updatedAt: chat.updatedAt.toISOString(),
    // Flattened before trimming, so the 140 characters are all words rather
    // than being spent on `##` and `**`. The slice ahead of it bounds the work
    // when an answer runs to thousands of characters.
    preview: chat.messages[0]
      ? toPlainText(chat.messages[0].content.slice(0, 600)).slice(0, 140) ||
        null
      : null,
  }))
}

/** Everything the library picker shows, newest upload first. */
export async function listLibraryDocuments(
  organizationId: string
): Promise<LibraryDocumentView[]> {
  const documents = await db.document.findMany({
    where: { organizationId },
    orderBy: { createdAt: "desc" },
    // Deliberately excludes `data` and `text`: the picker only needs labels,
    // and selecting the bytes would pull every upload into memory.
    select: {
      id: true,
      name: true,
      sizeBytes: true,
      pageCount: true,
      contentType: true,
      status: true,
    },
  })

  return documents.map((document) => ({
    id: document.id,
    name: document.name,
    meta: documentMeta(document.sizeBytes, document.pageCount),
    format: document.name.split(".").pop()?.toUpperCase() ?? "FILE",
    status: document.status,
  }))
}

/** Documents in this workspace whose name matches the library's search. */
function libraryNameFilter(organizationId: string, query: string) {
  const search = query.trim()

  return {
    organizationId,
    ...(search
      ? { name: { contains: search, mode: "insensitive" as const } }
      : {}),
  }
}

/**
 * The library's headline number and its four tab counts.
 *
 * Split from the rows so the page can paint its toolbar without waiting on the
 * table: these are two aggregates, the rows behind them are a scan. The counts
 * are taken under the name filter but not under the active tab, so switching
 * tabs never changes the numbers on the tabs themselves.
 */
export async function getLibraryCounts({
  organizationId,
  query = "",
}: {
  organizationId: string
  query?: string
}): Promise<LibraryCountsView> {
  const [libraryTotal, byStatus] = await Promise.all([
    db.document.count({ where: { organizationId } }),
    db.document.groupBy({
      by: ["status"],
      where: libraryNameFilter(organizationId, query),
      _count: true,
    }),
  ])

  const tally = new Map(byStatus.map((row) => [row.status, row._count]))

  return {
    libraryTotal,
    counts: {
      all: byStatus.reduce((sum, row) => sum + row._count, 0),
      indexed: tally.get("READY") ?? 0,
      indexing: tally.get("PROCESSING") ?? 0,
      failed: tally.get("FAILED") ?? 0,
    },
  }
}

/**
 * One page of library rows — `dashboard-library-page.png`.
 *
 * Paged in Postgres rather than in the browser: a workspace's library grows
 * without bound, and `data` is a `Bytes` column nobody wants pulled across.
 */
export async function getLibraryRows({
  organizationId,
  status = "all",
  query = "",
  page = 1,
}: {
  organizationId: string
  status?: LibraryStatusFilter
  query?: string
  page?: number
}): Promise<LibraryRowsView> {
  const activeStatus = libraryStatusFilters.find(
    (filter) => filter.value === status
  )?.status

  const matchingName = libraryNameFilter(organizationId, query)
  const scoped = activeStatus
    ? { ...matchingName, status: activeStatus }
    : matchingName

  const total = await db.document.count({ where: scoped })
  const { page: current, pageCount } = clampPage(page, total, LIBRARY_PAGE_SIZE)

  const documents = await db.document.findMany({
    where: scoped,
    orderBy: { createdAt: "desc" },
    skip: (current - 1) * LIBRARY_PAGE_SIZE,
    take: LIBRARY_PAGE_SIZE,
    // No `data` and no `text` — the table shows labels, and the bytes would be
    // megabytes per row for nothing.
    select: {
      id: true,
      name: true,
      sizeBytes: true,
      pageCount: true,
      status: true,
      createdAt: true,
      _count: { select: { chats: true } },
    },
  })

  return {
    documents: documents.map((document) => ({
      id: document.id,
      name: document.name,
      meta: documentMeta(document.sizeBytes, document.pageCount),
      format: document.name.split(".").pop()?.toUpperCase() ?? "FILE",
      status: document.status,
      createdAt: document.createdAt.toISOString(),
      chatCount: document._count.chats,
    })),
    total,
    page: current,
    pageCount,
  }
}

/** "Website_Brief_v2.docx" → "DOCX". */
function documentFormat(name: string) {
  return name.split(".").pop()?.toUpperCase() ?? "FILE"
}

/**
 * What passage search can actually see, grouped into the scope chips.
 *
 * Only documents with extracted text: a PDF is handed to Claude whole and its
 * text is never pulled out, so there is nothing here to match against. They're
 * counted separately so the page can say so rather than quietly omitting them.
 */
export async function getSearchScopes(organizationId: string): Promise<{
  scopes: SearchScopeView[]
  searchableTotal: number
  /** Indexed documents with no extracted text — PDFs, today. */
  unsearchableTotal: number
}> {
  const documents = await db.document.findMany({
    where: { organizationId, status: "READY" },
    // Names only: this runs on every search, and `text` is the whole document.
    select: { name: true, text: true },
  })

  const byFormat = new Map<string, number>()
  let searchableTotal = 0
  let unsearchableTotal = 0

  for (const document of documents) {
    if (document.text === null) {
      unsearchableTotal += 1
      continue
    }

    searchableTotal += 1
    const format = documentFormat(document.name)
    byFormat.set(format, (byFormat.get(format) ?? 0) + 1)
  }

  const scopes: SearchScopeView[] = [
    { value: "all", label: "All documents", count: searchableTotal },
    ...[...byFormat.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([format, count]) => ({ value: format, label: format, count })),
  ]

  return { scopes, searchableTotal, unsearchableTotal }
}

/**
 * Searches the workspace's documents for passages matching a query.
 *
 * Candidates are narrowed in Postgres first — a document that contains none of
 * the stems can't contain a matching passage, and `text` is the one column
 * worth not transferring. The passages themselves are cut and scored by
 * `lib/search.ts`.
 *
 * Arguments are positional and primitive on purpose: `cache` keys on argument
 * identity, so an options object — a fresh reference every call — would miss
 * every time. The header count and the results list both call this for the
 * same search, and only one of them should actually run it.
 */
export const searchPassages = cache(async function searchPassages(
  organizationId: string,
  query: string,
  scope: string = "all",
  page: number = 1
): Promise<SearchResultsView> {
  const stems = searchStems(query)

  const empty: SearchResultsView = {
    passages: [],
    total: 0,
    documentCount: 0,
    page: 1,
    pageCount: 1,
  }

  if (stems.length === 0) return empty

  const candidates = await db.document.findMany({
    where: {
      organizationId,
      status: "READY",
      text: { not: null },
      // A prefix stem has to match as a substring here and is narrowed
      // properly by the word-boundary matching in `scorePassage`.
      OR: stems.map(({ stem }) => ({
        text: { contains: stem, mode: "insensitive" as const },
      })),
      ...(scope === "all"
        ? {}
        : {
            name: {
              endsWith: `.${scope.toLowerCase()}`,
              mode: "insensitive" as const,
            },
          }),
    },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, pageCount: true, text: true },
  })

  const matched: SearchPassageView[] = []

  for (const document of candidates) {
    const format = documentFormat(document.name)

    splitPassages(document.text ?? "").forEach((passage, index) => {
      const scored = scorePassage(passage, stems)
      if (!scored) return

      matched.push({
        id: `${document.id}:${index}`,
        documentId: document.id,
        documentName: document.name,
        format,
        // Always null today, and honestly so: page numbers are only known for
        // PDFs, and a PDF has no extracted text for a passage to come from.
        // The card omits the chip rather than guessing at a number.
        page: null,
        ...scored,
      })
    })
  }

  matched.sort(
    (a, b) => b.score - a.score || a.documentName.localeCompare(b.documentName)
  )

  const total = matched.length
  const { page: current, pageCount } = clampPage(page, total, SEARCH_PAGE_SIZE)
  const start = (current - 1) * SEARCH_PAGE_SIZE

  return {
    passages: matched.slice(start, start + SEARCH_PAGE_SIZE),
    total,
    documentCount: new Set(matched.map((passage) => passage.documentId)).size,
    page: current,
    pageCount,
  }
})

/** Local `YYYY-MM-DD` — the day a question reads as to the person who asked it. */
function localDay(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

/**
 * Everything the usage page reports — `ui-design/dashboard/light/usage-page.png`.
 *
 * Every figure is measured, including the two that look like they'd need
 * instrumentation:
 *
 * - **Answer time** is the gap between a question's row and the row of the
 *   answer to it. The question is written when the request arrives and the
 *   answer when its stream finishes, so the difference is the wall-clock time
 *   the developer actually waited. Seeded analyses are excluded: their question
 *   is written when the chat is created and answered whenever the page is next
 *   opened, which could be days.
 * - **Most-questioned documents** counts answers that *cited* the document, not
 *   answers in chats that happen to include it. A chat with four documents
 *   would otherwise credit every question to all four.
 */
export async function getUsage(organizationId: string): Promise<UsageView> {
  const now = new Date()
  const period = usagePeriod(now)
  const monthStart = new Date(period.start)

  const chartStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - (USAGE_CHART_DAYS - 1)
  )

  const [documentsIndexed, questions, recent, answers, documents] =
    await Promise.all([
      db.document.count({ where: { organizationId, status: "READY" } }),
      countQuestionsThisMonth(organizationId),
      // Everything needed to chart the last fortnight and to time the answers
      // given this month — whichever window starts earlier.
      db.message.findMany({
        where: {
          chat: { organizationId },
          createdAt: { gte: chartStart < monthStart ? chartStart : monthStart },
        },
        orderBy: { createdAt: "asc" },
        select: {
          chatId: true,
          role: true,
          hidden: true,
          createdAt: true,
        },
      }),
      db.message.findMany({
        where: { chat: { organizationId }, role: "ASSISTANT" },
        select: { sources: true },
      }),
      db.document.findMany({
        where: { organizationId },
        select: { id: true, name: true },
      }),
    ])

  // --- Questions per day -------------------------------------------------
  const perDay = new Map<string, number>()

  for (let offset = 0; offset < USAGE_CHART_DAYS; offset += 1) {
    const day = new Date(
      chartStart.getFullYear(),
      chartStart.getMonth(),
      chartStart.getDate() + offset
    )
    perDay.set(localDay(day), 0)
  }

  for (const message of recent) {
    if (message.role !== "USER" || message.hidden) continue

    const key = localDay(message.createdAt)
    // Only days inside the window; the query reaches further back for timings.
    if (perDay.has(key)) perDay.set(key, (perDay.get(key) ?? 0) + 1)
  }

  // --- Answer time -------------------------------------------------------
  const pendingByChat = new Map<string, Date>()
  const durations: number[] = []

  for (const message of recent) {
    if (message.role === "USER") {
      // Hidden questions clear any pending one: the answer that follows is to
      // the seed, not to whatever came before it.
      pendingByChat.delete(message.chatId)
      if (!message.hidden) pendingByChat.set(message.chatId, message.createdAt)
      continue
    }

    const asked = pendingByChat.get(message.chatId)
    if (!asked) continue

    pendingByChat.delete(message.chatId)

    if (message.createdAt >= monthStart) {
      durations.push((message.createdAt.getTime() - asked.getTime()) / 1000)
    }
  }

  // --- Citations, and which documents earned them ------------------------
  const nameById = new Map(
    documents.map((document) => [document.id, document.name])
  )
  const citationsByDocument = new Map<string, number>()
  let citations = 0

  for (const answer of answers) {
    if (!Array.isArray(answer.sources)) continue

    const cited = new Set<string>()

    for (const source of answer.sources as { documentId?: string | null }[]) {
      citations += 1
      if (source?.documentId) cited.add(source.documentId)
    }

    for (const documentId of cited) {
      citationsByDocument.set(
        documentId,
        (citationsByDocument.get(documentId) ?? 0) + 1
      )
    }
  }

  return {
    period,
    questions,
    questionLimit: MONTHLY_QUESTION_LIMIT,
    documentsIndexed,
    citations,
    averageAnswerSeconds:
      durations.length > 0
        ? durations.reduce((sum, value) => sum + value, 0) / durations.length
        : null,
    days: [...perDay.entries()].map(([date, count]) => ({
      date,
      questions: count,
    })),
    documents: [...citationsByDocument.entries()]
      // A deleted document keeps its citations in old answers but has no name
      // to show, so it drops out of the list rather than appearing as "".
      .filter(([documentId]) => nameById.has(documentId))
      .map(([documentId, count]) => ({
        id: documentId,
        name: nameById.get(documentId)!,
        questions: count,
      }))
      .sort((a, b) => b.questions - a.questions || a.name.localeCompare(b.name))
      .slice(0, USAGE_TOP_DOCUMENTS),
  }
}

/**
 * Removes a document from the library for good.
 *
 * Scoped by workspace, so an id from another tenant deletes nothing rather
 * than being trusted because it was well-formed. The `chatDocument` links
 * cascade from the schema — a chat that cited it keeps its answers, it just
 * has one fewer source behind them, which is what the confirmation says.
 *
 * Returns false when nothing matched, so the caller can 404.
 */
export async function deleteDocument(
  documentId: string,
  organizationId: string
) {
  const result = await db.document.deleteMany({
    where: { id: documentId, organizationId },
  })

  return result.count > 0
}

/** The live numbers beside Chats and Library in the sidebar. */
export async function getNavCounts(
  organizationId: string
): Promise<DashboardNavCounts> {
  const [chats, documents] = await Promise.all([
    db.chat.count({ where: { organizationId } }),
    db.document.count({ where: { organizationId } }),
  ])

  return { chats, documents }
}

/**
 * Sources are JSON, and rows written before the source reader existed carry
 * only `{ index, document, page }`. Reading them back through here means the
 * panel never has to guard for missing fields.
 */
function normaliseSources(value: unknown): ChatSource[] {
  if (!Array.isArray(value)) return []

  return (value as Partial<ChatSource>[]).map((source, position) => ({
    index: source.index ?? position + 1,
    documentId: source.documentId ?? null,
    document: source.document ?? "Document",
    page: source.page ?? null,
    passages: source.passages ?? [],
  }))
}

function toMessageView(message: {
  id: string
  role: "USER" | "ASSISTANT"
  content: string
  sources: unknown
  feedback: MessageFeedbackView
}): ChatMessageView {
  return {
    id: message.id,
    role: message.role === "USER" ? "user" : "assistant",
    content: message.content,
    sources: normaliseSources(message.sources),
    feedback: message.feedback,
  }
}

/** One chat with its visible thread, or null when it isn't this workspace's. */
export async function getChat(
  chatId: string,
  organizationId: string
): Promise<ChatDetail | null> {
  const chat = await db.chat.findFirst({
    where: { id: chatId, organizationId },
    select: {
      id: true,
      title: true,
      documents: {
        orderBy: { position: "asc" },
        select: { document: { select: { id: true, name: true } } },
      },
      messages: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          role: true,
          content: true,
          sources: true,
          hidden: true,
          feedback: true,
        },
      },
    },
  })

  if (!chat) return null

  const last = chat.messages.at(-1)
  const questionsThisMonth = await countQuestionsThisMonth(organizationId)

  return {
    id: chat.id,
    title: chat.title,
    documents: chat.documents.map((link) => link.document),
    questionsThisMonth,
    // The seeded analysis request is context for Claude, not part of the thread.
    messages: chat.messages
      .filter((message) => !message.hidden)
      .map(toMessageView),
    // A trailing user turn means its answer never landed — either the seeded
    // analysis, or a follow-up interrupted by a reload.
    pendingAnswer: last?.role === "USER",
  }
}

/** The documents behind a chat, in citation order, with their bytes. */
export async function getChatDocuments(
  chatId: string
): Promise<DocumentPayload[]> {
  const links = await db.chatDocument.findMany({
    where: { chatId },
    orderBy: { position: "asc" },
    select: {
      document: {
        select: {
          id: true,
          name: true,
          contentType: true,
          data: true,
          text: true,
        },
      },
    },
  })

  return links.map((link) => link.document)
}

/** The full turn history Claude needs, seeded analysis request included. */
export async function getChatHistory(chatId: string) {
  const messages = await db.message.findMany({
    where: { chatId },
    orderBy: { createdAt: "asc" },
    select: { role: true, content: true },
  })

  return messages
}

/**
 * Opens a chat around one or more documents and seeds the brief-analysis
 * request. The request is stored hidden: Claude needs it as the opening user
 * turn, but showing it would put words in the developer's mouth.
 */
export async function createChat({
  organizationId,
  userId,
  documentIds,
  title,
  seedPrompt,
}: {
  organizationId: string
  userId: string
  documentIds: string[]
  title: string
  seedPrompt: string
}) {
  return db.chat.create({
    data: {
      organizationId,
      userId,
      title,
      documents: {
        create: documentIds.map((documentId, position) => ({
          documentId,
          position,
        })),
      },
      messages: {
        create: { role: "USER", content: seedPrompt, hidden: true },
      },
    },
    select: { id: true },
  })
}

/** Confirms every id belongs to this workspace and is ready to be read. */
export async function readyDocumentIds(
  documentIds: string[],
  organizationId: string
) {
  const documents = await db.document.findMany({
    where: { id: { in: documentIds }, organizationId, status: "READY" },
    select: { id: true, name: true },
  })

  return documents
}

export async function addMessage({
  chatId,
  role,
  content,
  sources,
}: {
  chatId: string
  role: "USER" | "ASSISTANT"
  content: string
  sources?: ChatSource[]
}) {
  const message = await db.message.create({
    data: { chatId, role, content, sources: sources ?? undefined },
    select: { id: true },
  })

  // Bump the chat so the sidebar's newest-first ordering stays honest.
  await db.chat.update({
    where: { id: chatId },
    data: { updatedAt: new Date() },
  })

  return message
}

/**
 * Records — or clears — how useful an answer was.
 *
 * Scoped through the chat's workspace, so a message id from another tenant
 * updates nothing rather than being trusted because it was well-formed.
 */
export async function setMessageFeedback({
  messageId,
  chatId,
  organizationId,
  feedback,
}: {
  messageId: string
  chatId: string
  organizationId: string
  feedback: MessageFeedbackView
}) {
  const result = await db.message.updateMany({
    where: {
      id: messageId,
      role: "ASSISTANT",
      chat: { id: chatId, organizationId },
    },
    data: { feedback },
  })

  return result.count > 0
}

/**
 * Deletes a chat and cleans up after it.
 *
 * Messages and the document links cascade from the schema. The documents
 * themselves are only removed when nothing else points at them: the library is
 * workspace-wide and the picker lets one brief be used by several chats, so
 * deleting a shared document here would silently break the other chats that
 * still cite it.
 *
 * Returns null when the chat isn't this workspace's, so the caller can 404
 * rather than reporting a deletion that never happened.
 */
export async function deleteChat(chatId: string, organizationId: string) {
  const chat = await db.chat.findFirst({
    where: { id: chatId, organizationId },
    select: { id: true, documents: { select: { documentId: true } } },
  })

  if (!chat) return null

  const documentIds = chat.documents.map((link) => link.documentId)

  return db.$transaction(async (tx) => {
    // Removing the chat first drops its `chatDocument` rows, which is what
    // makes the "is anything still using this?" count below meaningful.
    await tx.chat.delete({ where: { id: chat.id } })

    const stillLinked = await tx.chatDocument.findMany({
      where: { documentId: { in: documentIds } },
      select: { documentId: true },
      distinct: ["documentId"],
    })

    const shared = new Set(stillLinked.map((link) => link.documentId))
    const orphaned = documentIds.filter((id) => !shared.has(id))

    if (orphaned.length > 0) {
      await tx.document.deleteMany({
        where: { id: { in: orphaned }, organizationId },
      })
    }

    return {
      deletedDocuments: orphaned.length,
      keptSharedDocuments: documentIds.length - orphaned.length,
    }
  })
}

/**
 * Adds documents to a chat that already exists — what the composer's paperclip
 * does.
 *
 * New links go on the end so the existing citation numbering doesn't shift
 * under answers already written. Documents already on the chat are skipped
 * rather than duplicated, and the whole thing is refused if it would take the
 * chat past its document cap.
 */
export async function attachDocuments({
  chatId,
  organizationId,
  documentIds,
  maxDocuments,
}: {
  chatId: string
  organizationId: string
  documentIds: string[]
  maxDocuments: number
}) {
  const chat = await db.chat.findFirst({
    where: { id: chatId, organizationId },
    select: {
      id: true,
      documents: { select: { documentId: true, position: true } },
    },
  })

  if (!chat) return { ok: false as const, reason: "not-found" as const }

  const ready = await db.document.findMany({
    where: { id: { in: documentIds }, organizationId, status: "READY" },
    select: { id: true },
  })

  if (ready.length !== documentIds.length) {
    return { ok: false as const, reason: "unavailable" as const }
  }

  const existing = new Set(chat.documents.map((link) => link.documentId))
  const incoming = documentIds.filter((id) => !existing.has(id))

  if (incoming.length === 0) {
    return {
      ok: true as const,
      attached: 0,
      alreadyAttached: documentIds.length,
    }
  }

  if (existing.size + incoming.length > maxDocuments) {
    return { ok: false as const, reason: "too-many" as const }
  }

  const nextPosition =
    chat.documents.reduce(
      (highest, link) => Math.max(highest, link.position),
      -1
    ) + 1

  await db.chatDocument.createMany({
    data: incoming.map((documentId, offset) => ({
      chatId: chat.id,
      documentId,
      position: nextPosition + offset,
    })),
  })

  return {
    ok: true as const,
    attached: incoming.length,
    alreadyAttached: documentIds.length - incoming.length,
  }
}

export type WorkspaceStats = {
  /** Documents that finished reading — the ones a chat can actually use. */
  documentsIndexed: number
  /** Documents still being read, or that failed. */
  documentsPending: number
  /** Questions asked this calendar month, against the plan's allowance. */
  questionsThisMonth: number
}

/** The headline numbers on the dashboard home page. */
export async function getWorkspaceStats(
  organizationId: string
): Promise<WorkspaceStats> {
  const [documentsIndexed, documentsPending, questionsThisMonth] =
    await Promise.all([
      db.document.count({ where: { organizationId, status: "READY" } }),
      db.document.count({
        where: { organizationId, status: { not: "READY" } },
      }),
      countQuestionsThisMonth(organizationId),
    ])

  return { documentsIndexed, documentsPending, questionsThisMonth }
}

/** The newest uploads, for the home page's "Recent documents" list. */
export async function listRecentDocuments(
  organizationId: string,
  take = 3
): Promise<LibraryDocumentView[]> {
  const documents = await db.document.findMany({
    where: { organizationId },
    orderBy: { createdAt: "desc" },
    take,
    select: {
      id: true,
      name: true,
      sizeBytes: true,
      pageCount: true,
      status: true,
    },
  })

  return documents.map((document) => ({
    id: document.id,
    name: document.name,
    meta: documentMeta(document.sizeBytes, document.pageCount),
    format: document.name.split(".").pop()?.toUpperCase() ?? "FILE",
    status: document.status,
  }))
}

import { db } from "@/lib/db"
import type {
  ChatDetail,
  ChatMessageView,
  ChatSource,
  ChatSummary,
  LibraryDocumentView,
  MessageFeedbackView,
} from "@/lib/chat"
import { documentMeta, type DocumentPayload } from "@/lib/documents"

/**
 * Chat and document reads/writes. Server-only.
 *
 * Every query is scoped by `organizationId` — a workspace is the tenancy
 * boundary, so a chat id alone must never be enough to read someone else's
 * documents.
 */

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
    preview: chat.messages[0]?.content.slice(0, 140) ?? null,
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

  return {
    id: chat.id,
    title: chat.title,
    documents: chat.documents.map((link) => link.document),
    questionsUsed: chat.messages.filter(
      (message) => message.role === "USER" && !message.hidden
    ).length,
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

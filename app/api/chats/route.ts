import { NextResponse } from "next/server"

import { ANTHROPIC_BRIEF_ANALYSIS_PROMPT } from "@/lib/anthropic"
import { requireApiContext } from "@/lib/api-session"
import { createChat, readyDocumentIds } from "@/lib/chat-store"
import { MAX_DOCUMENTS_PER_CHAT } from "@/lib/chat"

/** "Website_Brief_v2.pdf" → "Website Brief v2". */
function titleFromDocument(name: string) {
  const withoutExtension = name.replace(/\.[^.]+$/, "")
  const spaced = withoutExtension.replace(/[_-]+/g, " ").trim()

  return spaced.slice(0, 120) || "Untitled document"
}

/**
 * Opens a chat around documents already in the library.
 *
 * The answer isn't generated here. This returns as soon as the chat exists so
 * the developer lands on the thread and watches the analysis stream in, rather
 * than staring at a spinner on the upload screen.
 */
export async function POST(request: Request) {
  const guard = await requireApiContext()
  if (!guard.ok) return guard.response

  let body: { documentIds?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Expected JSON." }, { status: 400 })
  }

  const requestedIds = Array.isArray(body.documentIds)
    ? body.documentIds.filter((id): id is string => typeof id === "string")
    : []

  if (requestedIds.length === 0) {
    return NextResponse.json(
      { error: "Add at least one document to start a chat." },
      { status: 400 }
    )
  }

  if (requestedIds.length > MAX_DOCUMENTS_PER_CHAT) {
    return NextResponse.json(
      { error: `A chat can hold at most ${MAX_DOCUMENTS_PER_CHAT} documents.` },
      { status: 400 }
    )
  }

  // Re-checks ownership and readiness server-side: the ids came from the
  // browser, so they prove nothing on their own.
  const documents = await readyDocumentIds(
    requestedIds,
    guard.context.organizationId
  )

  if (documents.length !== requestedIds.length) {
    return NextResponse.json(
      { error: "Some of those documents aren't available." },
      { status: 400 }
    )
  }

  // Preserve the order the developer picked, not the order Postgres returned.
  const ordered = requestedIds.map((id) =>
    documents.find((document) => document.id === id)!
  )

  const chat = await createChat({
    organizationId: guard.context.organizationId,
    userId: guard.context.userId,
    documentIds: ordered.map((document) => document.id),
    title: titleFromDocument(ordered[0].name),
    seedPrompt: ANTHROPIC_BRIEF_ANALYSIS_PROMPT,
  })

  return NextResponse.json({ id: chat.id }, { status: 201 })
}

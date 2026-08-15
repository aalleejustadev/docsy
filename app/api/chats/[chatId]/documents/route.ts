import { NextResponse } from "next/server"

import { requireApiContext } from "@/lib/api-session"
import { MAX_DOCUMENTS_PER_CHAT } from "@/lib/chat"
import { attachDocuments } from "@/lib/chat-store"

const FAILURES = {
  "not-found": { status: 404, error: "Chat not found." },
  unavailable: {
    status: 400,
    error: "Some of those documents aren't available.",
  },
  "too-many": {
    status: 400,
    error: `A chat can hold at most ${MAX_DOCUMENTS_PER_CHAT} documents.`,
  },
} as const

/** Adds documents to an existing chat — the composer's paperclip. */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ chatId: string }> }
) {
  const guard = await requireApiContext()
  if (!guard.ok) return guard.response

  let body: { documentIds?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Expected JSON." }, { status: 400 })
  }

  const documentIds = Array.isArray(body.documentIds)
    ? body.documentIds.filter((id): id is string => typeof id === "string")
    : []

  if (documentIds.length === 0) {
    return NextResponse.json(
      { error: "No documents to attach." },
      { status: 400 }
    )
  }

  const { chatId } = await params

  const result = await attachDocuments({
    chatId,
    organizationId: guard.context.organizationId,
    documentIds,
    maxDocuments: MAX_DOCUMENTS_PER_CHAT,
  })

  if (!result.ok) {
    const failure = FAILURES[result.reason]

    return NextResponse.json(
      { error: failure.error },
      { status: failure.status }
    )
  }

  return NextResponse.json(result)
}

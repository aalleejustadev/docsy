import { NextResponse } from "next/server"

import { requireApiContext } from "@/lib/api-session"
import { listChats, listLibraryDocuments } from "@/lib/chat-store"

/**
 * Everything the command palette can jump to.
 *
 * Returned whole rather than filtered server-side: a workspace's chats and
 * documents are a small set, and handing them over once lets the palette
 * filter on every keystroke without a round trip per character.
 */
export async function GET() {
  const guard = await requireApiContext()
  if (!guard.ok) return guard.response

  const [chats, documents] = await Promise.all([
    listChats(guard.context.organizationId),
    listLibraryDocuments(guard.context.organizationId),
  ])

  return NextResponse.json({ chats, documents })
}

import { NextResponse } from "next/server"

import { requireApiContext } from "@/lib/api-session"
import { deleteChat } from "@/lib/chat-store"

/**
 * Deletes a chat, along with any document it leaves behind.
 *
 * Messages and document links go with it through the schema's cascades; the
 * documents themselves are handled in `deleteChat`, which only removes the ones
 * no other chat is still using.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ chatId: string }> }
) {
  const guard = await requireApiContext()
  if (!guard.ok) return guard.response

  const { chatId } = await params

  const result = await deleteChat(chatId, guard.context.organizationId)

  if (!result) {
    return NextResponse.json({ error: "Chat not found." }, { status: 404 })
  }

  return NextResponse.json(result)
}

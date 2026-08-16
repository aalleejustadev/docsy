import { NextResponse } from "next/server"

import { requireApiContext } from "@/lib/api-session"
import { deleteDocument } from "@/lib/chat-store"
import { db } from "@/lib/db"

/**
 * Serves an uploaded document back — what "Open full document" opens.
 *
 * Unlike avatars, this is workspace-scoped: a brief is the customer's own
 * material, so the id alone must never be enough to read it.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ documentId: string }> }
) {
  const guard = await requireApiContext()
  if (!guard.ok) return guard.response

  const { documentId } = await params

  const document = await db.document.findFirst({
    where: { id: documentId, organizationId: guard.context.organizationId },
    select: { name: true, contentType: true, data: true },
  })

  if (!document) {
    return NextResponse.json({ error: "Document not found." }, { status: 404 })
  }

  return new NextResponse(new Uint8Array(document.data), {
    headers: {
      "Content-Type": document.contentType || "application/octet-stream",
      // `inline` so a PDF opens in the browser's viewer rather than downloading.
      // The filename is quoted and stripped of quotes so it can't break out of
      // the header.
      "Content-Disposition": `inline; filename="${document.name.replace(/"/g, "")}"`,
      "Cache-Control": "private, max-age=300",
    },
  })
}

/** Removes a document from the library — the library row's overflow menu. */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ documentId: string }> }
) {
  const guard = await requireApiContext()
  if (!guard.ok) return guard.response

  const { documentId } = await params

  const deleted = await deleteDocument(documentId, guard.context.organizationId)

  if (!deleted) {
    return NextResponse.json({ error: "Document not found." }, { status: 404 })
  }

  return NextResponse.json({ ok: true })
}

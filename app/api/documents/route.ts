import { NextResponse } from "next/server"

import { requireApiContext } from "@/lib/api-session"
import { formatBytes, type LibraryDocumentView } from "@/lib/chat"
import { db } from "@/lib/db"
import {
  classifyDocument,
  documentMeta,
  extractDocument,
  MAX_DOCUMENT_BYTES,
} from "@/lib/documents"

/**
 * Takes an upload into the workspace library.
 *
 * Extraction happens inline rather than in a background job: a brief is a
 * handful of megabytes and the developer is waiting on the answer, so a queue
 * would add moving parts without saving them any time.
 */
export async function POST(request: Request) {
  const guard = await requireApiContext()
  if (!guard.ok) return guard.response

  const form = await request.formData()
  const file = form.get("file")

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file uploaded." }, { status: 400 })
  }

  if (file.size === 0) {
    return NextResponse.json({ error: "That file is empty." }, { status: 400 })
  }

  if (file.size > MAX_DOCUMENT_BYTES) {
    return NextResponse.json(
      {
        error: `That file is ${formatBytes(file.size)}. The limit is ${formatBytes(MAX_DOCUMENT_BYTES)}.`,
      },
      { status: 413 }
    )
  }

  const type = classifyDocument(file.name, file.type)

  if (!type) {
    return NextResponse.json(
      { error: "Docsy reads PDF, Word (.docx), text and markdown files." },
      { status: 415 }
    )
  }

  const bytes = Buffer.from(await file.arrayBuffer())

  let extracted
  try {
    extracted = await extractDocument(bytes, type.kind)
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Couldn't read that file.",
      },
      { status: 422 }
    )
  }

  const document = await db.document.create({
    data: {
      organizationId: guard.context.organizationId,
      userId: guard.context.userId,
      name: file.name,
      contentType: file.type || "application/octet-stream",
      sizeBytes: file.size,
      pageCount: extracted.pageCount,
      data: bytes,
      text: extracted.text,
      status: "READY",
    },
    select: { id: true, name: true, sizeBytes: true, pageCount: true },
  })

  const view: LibraryDocumentView = {
    id: document.id,
    name: document.name,
    meta: documentMeta(document.sizeBytes, document.pageCount),
    format: type.format,
    status: "READY",
  }

  return NextResponse.json(view, { status: 201 })
}

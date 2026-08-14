import mammoth from "mammoth"
import type Anthropic from "@anthropic-ai/sdk"

import { formatBytes } from "@/lib/chat"

/**
 * Reading and packaging uploaded sources. Server-only — `mammoth` is a Node
 * library and the raw bytes never belong in a browser bundle.
 */

/**
 * Base64 inflates by a third and the Messages API caps a request at 32 MB, so
 * this leaves room for the rest of the conversation on top of the document.
 */
export const MAX_DOCUMENT_BYTES = 15 * 1024 * 1024

const PDF_TYPE = "application/pdf"
const DOCX_TYPE =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"

/**
 * `pdf` goes to Claude untouched so it reads the layout rather than a
 * flattened transcription; the rest are extracted to text first.
 */
type DocumentKind = "pdf" | "docx" | "text"

type DocumentType = { kind: DocumentKind; format: string }

const BY_CONTENT_TYPE: Record<string, DocumentType> = {
  [PDF_TYPE]: { kind: "pdf", format: "PDF" },
  [DOCX_TYPE]: { kind: "docx", format: "DOCX" },
  "text/plain": { kind: "text", format: "TXT" },
  "text/markdown": { kind: "text", format: "MD" },
}

const BY_EXTENSION: Record<string, DocumentType> = {
  pdf: { kind: "pdf", format: "PDF" },
  docx: { kind: "docx", format: "DOCX" },
  txt: { kind: "text", format: "TXT" },
  md: { kind: "text", format: "MD" },
}

/**
 * Browsers are inconsistent about content types — Windows often sends
 * `application/octet-stream` for `.md`, and some send nothing at all — so the
 * extension is the fallback rather than the other way round.
 */
export function classifyDocument(
  name: string,
  contentType: string
): DocumentType | null {
  const byType = BY_CONTENT_TYPE[contentType.split(";")[0].trim()]
  if (byType) return byType

  const extension = name.split(".").pop()?.toLowerCase() ?? ""

  return BY_EXTENSION[extension] ?? null
}

/**
 * Page count from the raw PDF, for the library row's "· 18 pages".
 *
 * Deliberately naive: PDFs that store their page tree in a compressed object
 * stream won't match, and that's fine — the count is decoration, so a miss
 * returns null and the row just shows its size. Claude gets the real page
 * numbers from the document itself when it cites.
 */
function countPdfPages(bytes: Buffer) {
  const matches = bytes.toString("latin1").match(/\/Type\s*\/Page[^s]/g)

  return matches?.length || null
}

export type ExtractedDocument = {
  /** Null for PDFs, which Claude reads natively. */
  text: string | null
  pageCount: number | null
}

/** Pulls out whatever Claude will need to read, or explains why it can't. */
export async function extractDocument(
  bytes: Buffer,
  kind: DocumentKind
): Promise<ExtractedDocument> {
  if (kind === "pdf") {
    return { text: null, pageCount: countPdfPages(bytes) }
  }

  const text =
    kind === "docx"
      ? (await mammoth.extractRawText({ buffer: bytes })).value
      : bytes.toString("utf8")

  if (!text.trim()) {
    throw new Error(
      "That file has no readable text. If it's a scan, save it as a PDF so it can be read."
    )
  }

  return { text, pageCount: null }
}

/** "2.4 MB · 18 pages" for the library row. */
export function documentMeta(sizeBytes: number, pageCount: number | null) {
  const size = formatBytes(sizeBytes)

  return pageCount ? `${size} · ${pageCount} pages` : size
}

/** The columns needed to hand a stored document to Claude. */
export type DocumentPayload = {
  name: string
  contentType: string
  data: Uint8Array
  text: string | null
}

/**
 * A document content block with citations turned on, so Claude returns
 * structured references — real page numbers rather than ones it recalled.
 */
export function toDocumentBlock(
  document: DocumentPayload
): Anthropic.Beta.Messages.BetaRequestDocumentBlock {
  const shared = {
    type: "document" as const,
    title: document.name,
    citations: { enabled: true },
  }

  if (document.text === null) {
    return {
      ...shared,
      source: {
        type: "base64",
        media_type: "application/pdf",
        data: Buffer.from(document.data).toString("base64"),
      },
    }
  }

  return {
    ...shared,
    source: {
      type: "text",
      media_type: "text/plain",
      data: document.text,
    },
  }
}

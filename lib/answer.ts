import type Anthropic from "@anthropic-ai/sdk"

import {
  anthropic,
  ANTHROPIC_CACHE_CONTROL,
  ANTHROPIC_REQUEST_DEFAULTS,
  describeAnthropicError,
} from "@/lib/anthropic"
import type { ChatSource } from "@/lib/chat"
import { toDocumentBlock, type DocumentPayload } from "@/lib/documents"

/**
 * Generating an answer: the Claude call, the citation bookkeeping, and the
 * markers that let a click in the answer open the exact quote behind it.
 *
 * Kept out of the route handler so it can be exercised directly — the citation
 * plumbing is the part most likely to break quietly, and a 200 with plausible
 * prose is not evidence that it worked.
 */

/** What the browser receives, one JSON object per line. */
export type AnswerEvent =
  | { type: "text"; value: string }
  | { type: "done"; sources: ChatSource[] }
  | { type: "error"; value: string }

/** Characters of document text kept either side of a quote, for context. */
const CONTEXT_CHARS = 320

/** How many distinct quotes are kept per source before the rest are dropped. */
const MAX_PASSAGES = 12

/** Trims a context slice back to a word boundary so it doesn't start mid-word. */
function trimToWord(text: string, from: "start" | "end") {
  if (from === "start") {
    const space = text.indexOf(" ")
    return space > 0 && space < 40 ? text.slice(space + 1) : text
  }

  const space = text.lastIndexOf(" ")
  return space > text.length - 40 ? text.slice(0, space) : text
}

/**
 * Numbers a citation and records the passage behind it.
 *
 * Sources are keyed by document and page rather than by passage, so an answer
 * that leans on the same page twenty times still reads `[1]` rather than
 * `[1]…[20]`. Each distinct quote is appended to that source's `passages`, and
 * its position is what the marker carries.
 */
export function resolveCitation(
  citation: Anthropic.Beta.Messages.BetaTextCitation,
  documents: DocumentPayload[],
  sources: ChatSource[],
  indexByKey: Map<string, number>
): { source: ChatSource; passage: number } | null {
  // Web-search citations can't occur here — we only ever send documents — but
  // the union includes them, and they carry no document title.
  if (!("document_title" in citation)) return null

  const origin = documents[citation.document_index]
  const document = citation.document_title ?? origin?.name ?? "Document"
  const page =
    citation.type === "page_location" ? citation.start_page_number : null
  const key = `${document}#${page ?? ""}`

  let source = sources.find(
    (candidate) => candidate.index === indexByKey.get(key)
  )

  if (!source) {
    source = {
      index: sources.length + 1,
      documentId: origin?.id ?? null,
      document,
      page,
      passages: [],
    }
    sources.push(source)
    indexByKey.set(key, source.index)
  }

  const text = citation.cited_text.trim()

  // Context only exists for documents whose text we extracted. A PDF goes to
  // Claude as bytes, so there's nothing on our side to read around the quote.
  let before: string | null = null
  let after: string | null = null

  if (citation.type === "char_location" && origin?.text) {
    before = trimToWord(
      origin.text.slice(
        Math.max(0, citation.start_char_index - CONTEXT_CHARS),
        citation.start_char_index
      ),
      "start"
    )
    after = trimToWord(
      origin.text.slice(
        citation.end_char_index,
        citation.end_char_index + CONTEXT_CHARS
      ),
      "end"
    )
  }

  // De-duplicated because Claude often cites the same sentence for several
  // claims, and capped so a long answer can't bloat the stored JSON.
  let passage = source.passages.findIndex((entry) => entry.text === text)

  if (passage === -1 && source.passages.length < MAX_PASSAGES) {
    passage = source.passages.push({ text, before, after }) - 1
  }

  return { source, passage }
}

/** Puts the documents on the opening turn, where the cached prefix lives. */
export function buildMessages(
  documents: DocumentPayload[],
  history: { role: "USER" | "ASSISTANT"; content: string }[]
): Anthropic.Beta.Messages.BetaMessageParam[] {
  const documentBlocks = documents.map(toDocumentBlock)

  // Cache the document span — it's identical on every turn of the chat, and
  // it's by far the largest part of the prompt. The breakpoint goes on the last
  // document rather than the system prompt, which is too short to cache alone.
  documentBlocks[documentBlocks.length - 1].cache_control =
    ANTHROPIC_CACHE_CONTROL

  return history.map((message, index) => {
    const role =
      message.role === "USER" ? ("user" as const) : ("assistant" as const)

    if (index === 0) {
      return {
        role,
        content: [
          ...documentBlocks,
          { type: "text" as const, text: message.content },
        ],
      }
    }

    return { role, content: message.content }
  })
}

/**
 * Streams an answer, emitting text as it arrives and citation markers as each
 * cited span closes.
 *
 * Markers are written as `[1:0]` — source 1, passage 0 — so a click in the
 * answer can open that exact quote rather than just the document. The UI
 * renders only the `[1]` half.
 */
export async function* streamAnswer(
  documents: DocumentPayload[],
  history: { role: "USER" | "ASSISTANT"; content: string }[]
): AsyncGenerator<AnswerEvent> {
  const sources: ChatSource[] = []
  const indexByKey = new Map<string, number>()

  try {
    const claude = anthropic.beta.messages.stream({
      ...ANTHROPIC_REQUEST_DEFAULTS,
      messages: buildMessages(documents, history),
    })

    let blockCitations: string[] = []

    for await (const event of claude) {
      if (
        event.type === "content_block_start" &&
        event.content_block.type === "text"
      ) {
        blockCitations = []
      }

      if (event.type === "content_block_delta") {
        if (event.delta.type === "text_delta") {
          yield { type: "text", value: event.delta.text }
        }

        if (event.delta.type === "citations_delta") {
          const resolved = resolveCitation(
            event.delta.citation,
            documents,
            sources,
            indexByKey
          )

          if (resolved) {
            // A passage that overflowed the cap degrades to a bare `[1]`,
            // which still opens the document.
            const marker =
              resolved.passage === -1
                ? `[${resolved.source.index}]`
                : `[${resolved.source.index}:${resolved.passage}]`

            if (!blockCitations.includes(marker)) blockCitations.push(marker)
          }
        }
      }

      // Markers land after the sentence they support, which is where the
      // reference reads naturally: "…60 days' notice [1]."
      if (event.type === "content_block_stop" && blockCitations.length) {
        yield { type: "text", value: blockCitations.join("") }
        blockCitations = []
      }
    }

    const final = await claude.finalMessage()

    // A decline arrives as a normal 200 with empty or partial content, so
    // anything already streamed is discarded rather than saved as an answer.
    if (final.stop_reason === "refusal") {
      yield {
        type: "error",
        value:
          "Claude declined to answer that one. Rephrasing the question usually clears it.",
      }
      return
    }

    yield { type: "done", sources }
  } catch (error) {
    console.error("[chat] answer failed", error)
    yield { type: "error", value: describeAnthropicError(error) }
  }
}

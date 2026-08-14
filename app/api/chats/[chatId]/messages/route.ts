import { NextResponse } from "next/server"
import type Anthropic from "@anthropic-ai/sdk"

import {
  anthropic,
  ANTHROPIC_CACHE_CONTROL,
  ANTHROPIC_REQUEST_DEFAULTS,
  describeAnthropicError,
  isAnthropicConfigured,
} from "@/lib/anthropic"
import { requireApiContext } from "@/lib/api-session"
import type { ChatSource } from "@/lib/chat"
import {
  addMessage,
  getChat,
  getChatDocuments,
  getChatHistory,
} from "@/lib/chat-store"
import { toDocumentBlock } from "@/lib/documents"

/** Reading a long brief and writing the briefing takes minutes, not seconds. */
export const maxDuration = 300

/**
 * Newline-delimited JSON, one event per line. Plain `text/event-stream` would
 * work too, but NDJSON needs no framing rules and the client can parse it with
 * a split on "\n".
 */
type StreamEvent =
  | { type: "text"; value: string }
  | { type: "done"; sources: ChatSource[]; messageId: string }
  | { type: "error"; value: string }

/**
 * Numbers a citation, reusing the index when the same place is cited twice.
 *
 * Claude returns these attached to the text they support, so `sources` ends up
 * ordered by first appearance — which is what makes the `[n]` markers read in
 * sequence down the answer.
 */
function resolveCitation(
  citation: Anthropic.Beta.Messages.BetaTextCitation,
  sources: ChatSource[],
  indexByKey: Map<string, number>
): ChatSource | null {
  // Web-search citations can't occur here — we only ever send documents — but
  // the union includes them, and they carry no document title.
  if (!("document_title" in citation)) return null

  const document = citation.document_title ?? "Document"
  const page =
    citation.type === "page_location" ? citation.start_page_number : null
  const key = `${document}#${page ?? ""}`

  const existing = indexByKey.get(key)
  if (existing) {
    return sources[existing - 1]
  }

  const source: ChatSource = { index: sources.length + 1, document, page }
  sources.push(source)
  indexByKey.set(key, source.index)

  return source
}

/**
 * Answers the chat's outstanding turn and streams it back.
 *
 * With a `question` it records that question first; without one it answers the
 * turn already waiting — the seeded brief analysis on a new chat, or a
 * follow-up whose answer was interrupted by a reload.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ chatId: string }> }
) {
  const guard = await requireApiContext()
  if (!guard.ok) return guard.response

  if (!isAnthropicConfigured()) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY isn't set, so Docsy can't answer yet." },
      { status: 503 }
    )
  }

  const { chatId } = await params
  const chat = await getChat(chatId, guard.context.organizationId)

  if (!chat) {
    return NextResponse.json({ error: "Chat not found." }, { status: 404 })
  }

  let body: { question?: unknown } = {}
  try {
    body = await request.json()
  } catch {
    // No body is the normal case for "answer the turn already waiting".
  }

  const question =
    typeof body.question === "string" ? body.question.trim() : undefined

  if (question) {
    await addMessage({ chatId, role: "USER", content: question })
  } else if (!chat.pendingAnswer) {
    return NextResponse.json(
      { error: "That chat has nothing waiting on an answer." },
      { status: 409 }
    )
  }

  const [documents, history] = await Promise.all([
    getChatDocuments(chatId),
    getChatHistory(chatId),
  ])

  if (documents.length === 0) {
    return NextResponse.json(
      { error: "That chat has no documents to read." },
      { status: 409 }
    )
  }

  const documentBlocks = documents.map(toDocumentBlock)

  // Cache the document span — it's identical on every turn of the chat, and
  // it's by far the largest part of the prompt. The breakpoint goes on the last
  // document rather than the system prompt, which is too short to cache alone.
  documentBlocks[documentBlocks.length - 1].cache_control =
    ANTHROPIC_CACHE_CONTROL

  const messages: Anthropic.Beta.Messages.BetaMessageParam[] = history.map(
    (message, index) => {
      const role =
        message.role === "USER" ? ("user" as const) : ("assistant" as const)

      // The documents ride on the opening turn, ahead of its text, so every
      // later turn is cheap and the cached prefix stays byte-identical.
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
    }
  )

  const encoder = new TextEncoder()

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: StreamEvent) =>
        controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`))

      const sources: ChatSource[] = []
      const indexByKey = new Map<string, number>()
      let answer = ""

      const push = (text: string) => {
        answer += text
        send({ type: "text", value: text })
      }

      try {
        const claude = anthropic.beta.messages.stream({
          ...ANTHROPIC_REQUEST_DEFAULTS,
          messages,
        })

        let blockCitations: ChatSource[] = []

        for await (const event of claude) {
          if (
            event.type === "content_block_start" &&
            event.content_block.type === "text"
          ) {
            blockCitations = []
          }

          if (event.type === "content_block_delta") {
            if (event.delta.type === "text_delta") {
              push(event.delta.text)
            }

            if (event.delta.type === "citations_delta") {
              const source = resolveCitation(
                event.delta.citation,
                sources,
                indexByKey
              )

              if (
                source &&
                !blockCitations.some((cited) => cited.index === source.index)
              ) {
                blockCitations.push(source)
              }
            }
          }

          // Markers land after the sentence they support, which is where the
          // reference reads naturally: "…60 days' notice [1]."
          if (event.type === "content_block_stop" && blockCitations.length) {
            push(blockCitations.map((cited) => `[${cited.index}]`).join(""))
            blockCitations = []
          }
        }

        const final = await claude.finalMessage()

        // A decline arrives as a normal 200 with empty or partial content, so
        // anything already streamed is discarded rather than saved as an answer.
        if (final.stop_reason === "refusal") {
          send({
            type: "error",
            value:
              "Claude declined to answer that one. Rephrasing the question usually clears it.",
          })
          return
        }

        if (!answer.trim()) {
          send({ type: "error", value: "Claude returned an empty answer." })
          return
        }

        const saved = await addMessage({
          chatId,
          role: "ASSISTANT",
          content: answer,
          sources,
        })

        // The id goes back so the browser's optimistic copy of this answer can
        // be rated — feedback needs the real row, not a placeholder key.
        send({ type: "done", sources, messageId: saved.id })
      } catch (error) {
        console.error("[chat] answer failed", error)
        send({ type: "error", value: describeAnthropicError(error) })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
    },
  })
}

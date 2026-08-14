import { NextResponse } from "next/server"

import { requireApiContext } from "@/lib/api-session"
import type { MessageFeedbackView } from "@/lib/chat"
import { setMessageFeedback } from "@/lib/chat-store"

const FEEDBACK_VALUES = ["UP", "DOWN"] as const

function parseFeedback(value: unknown): MessageFeedbackView | undefined {
  // Null is meaningful — it's how a rating is taken back — so it can't share a
  // branch with "the caller sent something we don't understand".
  if (value === null) return null
  if (typeof value !== "string") return undefined

  return FEEDBACK_VALUES.includes(value as (typeof FEEDBACK_VALUES)[number])
    ? (value as MessageFeedbackView)
    : undefined
}

/** Rates an answer, or clears the rating when `feedback` is null. */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ chatId: string; messageId: string }> }
) {
  const guard = await requireApiContext()
  if (!guard.ok) return guard.response

  let body: { feedback?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Expected JSON." }, { status: 400 })
  }

  const feedback = parseFeedback(body.feedback)

  if (feedback === undefined) {
    return NextResponse.json(
      { error: "feedback must be UP, DOWN or null." },
      { status: 400 }
    )
  }

  const { chatId, messageId } = await params

  const updated = await setMessageFeedback({
    messageId,
    chatId,
    organizationId: guard.context.organizationId,
    feedback,
  })

  if (!updated) {
    return NextResponse.json({ error: "Answer not found." }, { status: 404 })
  }

  return NextResponse.json({ feedback })
}

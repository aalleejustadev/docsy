"use client"

import * as React from "react"
import { CheckIcon, CopyIcon, ThumbsDownIcon, ThumbsUpIcon } from "lucide-react"

import type { MessageFeedbackView } from "@/lib/chat"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/toast"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

/**
 * Copy and rate an answer — `ui-design/dashboard/light/chat-page-chat.png`.
 *
 * The rating is a `ToggleGroup` rather than two buttons with hand-managed
 * state: it's one choice out of two, so the group owns which is pressed and
 * gives keyboard and ARIA behaviour for free.
 */
function AnswerActions({
  chatId,
  messageId,
  content,
  feedback: initialFeedback,
}: {
  chatId: string
  messageId: string
  /** The raw Markdown, which is what lands on the clipboard. */
  content: string
  feedback: MessageFeedbackView
}) {
  const [copied, setCopied] = React.useState(false)
  const [feedback, setFeedback] = React.useState(initialFeedback)

  async function copy() {
    try {
      // Markers are stored as `[1:0]` so a click can find the exact passage.
      // The passage half is plumbing — what gets copied reads as `[1]`.
      await navigator.clipboard.writeText(
        content.replace(/\[(\d+):\d+\]/g, "[$1]")
      )
      setCopied(true)
      toast.add({ title: "Answer copied to your clipboard." })
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.add({
        title: "Couldn't copy that.",
        description: "Your browser blocked clipboard access.",
      })
    }
  }

  async function rate(next: MessageFeedbackView) {
    const previous = feedback

    // Optimistic: the button state is the whole point of the interaction, so it
    // shouldn't wait on a round trip. It rolls back if the write fails.
    setFeedback(next)

    try {
      const response = await fetch(
        `/api/chats/${chatId}/messages/${messageId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ feedback: next }),
        }
      )

      if (!response.ok) throw new Error("request failed")

      toast.add({
        title:
          next === null
            ? "Feedback cleared."
            : next === "UP"
              ? "Thanks — glad that was useful."
              : "Thanks — we'll use this to improve answers.",
      })
    } catch {
      setFeedback(previous)
      toast.add({
        title: "Couldn't save that feedback.",
        description: "Check your connection and try again.",
      })
    }
  }

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="outline"
        size="icon-sm"
        className="cursor-pointer"
        aria-label="Copy answer"
        onClick={copy}
      >
        {copied ? <CheckIcon /> : <CopyIcon />}
      </Button>

      <ToggleGroup
        variant="outline"
        size="sm"
        spacing={1}
        // Base UI keeps values in an array even for a single choice, and an
        // empty array is how it reports "unpressed" — which is a rating being
        // taken back rather than an unknown value.
        value={feedback ? [feedback] : []}
        onValueChange={(value: string[]) =>
          void rate((value[0] as MessageFeedbackView) ?? null)
        }
      >
        <ToggleGroupItem
          value="UP"
          aria-label="This answer was helpful"
          className="cursor-pointer"
        >
          <ThumbsUpIcon />
        </ToggleGroupItem>

        <ToggleGroupItem
          value="DOWN"
          aria-label="This answer was not helpful"
          className="cursor-pointer"
        >
          <ThumbsDownIcon />
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  )
}

export { AnswerActions }

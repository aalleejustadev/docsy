"use client"

import * as React from "react"
import { ArrowRightIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from "@/components/ui/input-group"

const COMPOSER_TONES = {
  /** New chat: a filled bar floating over empty space — `chat-main.png`. */
  filled: "border-transparent bg-muted",
  /** Open chat: a card above the thread, with a footer row — `chat-page-chat.png`. */
  outline: "bg-card",
}

/**
 * The question box. Enter sends, Shift+Enter breaks the line, and the send
 * button stays inert until there's something to send.
 */
function ChatComposer({
  placeholder,
  disabled = false,
  tone = "filled",
  footer,
  onSend,
  className,
}: {
  placeholder: string
  disabled?: boolean
  tone?: keyof typeof COMPOSER_TONES
  /** Controls left of the send button, on their own row. */
  footer?: React.ReactNode
  onSend?: (question: string) => void
  className?: string
}) {
  const [value, setValue] = React.useState("")
  const canSend = !disabled && value.trim().length > 0

  function send() {
    if (!canSend) return

    onSend?.(value.trim())
    setValue("")
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        send()
      }}
    >
      <InputGroup
        className={cn("rounded-2xl", COMPOSER_TONES[tone], className)}
      >
        <InputGroupTextarea
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault()
              send()
            }
          }}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          aria-label="Ask a question about your documents"
          className="min-h-12 px-4 py-3.5"
        />

        {footer ? (
          <InputGroupAddon align="block-end" className="gap-2 px-3">
            {footer}
            <SendButton canSend={canSend} tone={tone} />
          </InputGroupAddon>
        ) : (
          <InputGroupAddon align="inline-end" className="pr-3">
            <SendButton canSend={canSend} tone={tone} />
          </InputGroupAddon>
        )}
      </InputGroup>
    </form>
  )
}

function SendButton({
  canSend,
  tone,
}: {
  canSend: boolean
  tone: keyof typeof COMPOSER_TONES
}) {
  return (
    <InputGroupButton
      type="submit"
      size="icon-sm"
      variant={tone === "outline" ? "default" : "ghost"}
      disabled={!canSend}
      aria-label="Send question"
      className="cursor-pointer"
    >
      <ArrowRightIcon />
    </InputGroupButton>
  )
}

export { ChatComposer }

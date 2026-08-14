"use client"

import * as React from "react"
import {
  ChevronDownIcon,
  CopyIcon,
  LayersIcon,
  PaperclipIcon,
  ThumbsDownIcon,
  ThumbsUpIcon,
} from "lucide-react"

import type { Chat, ChatMessage } from "@/lib/chat"
import { MONTHLY_QUESTION_LIMIT } from "@/lib/chat"
import { Bubble, BubbleContent } from "@/components/ui/bubble"
import { Button } from "@/components/ui/button"
import { InputGroupButton } from "@/components/ui/input-group"
import {
  Message,
  MessageContent,
  MessageFooter,
  MessageHeader,
} from "@/components/ui/message"
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "@/components/ui/message-scroller"
import { Separator } from "@/components/ui/separator"
import { DocsyMark } from "@/components/brand/docsy-logo"
import { ChatComposer } from "@/components/chat/chat-composer"

/** Turns the `[1]` markers the model writes into superscript citations. */
function withCitations(content: string) {
  return content.split(/(\[\d+\])/g).map((part, index) =>
    /^\[\d+\]$/.test(part) ? (
      <sup
        key={index}
        className="ml-0.5 font-mono text-[0.625rem] font-semibold text-brand"
      >
        {part}
      </sup>
    ) : (
      <React.Fragment key={index}>{part}</React.Fragment>
    )
  )
}

function ChatTurn({ message }: { message: ChatMessage }) {
  if (message.role === "user") {
    return (
      <Message align="end">
        <MessageContent>
          <Bubble variant="muted" align="end">
            <BubbleContent className="px-4 py-3">
              {message.content}
            </BubbleContent>
          </Bubble>
        </MessageContent>
      </Message>
    )
  }

  return (
    <Message align="start">
      <MessageContent className="gap-3">
        <MessageHeader className="gap-2 px-0">
          <DocsyMark className="size-5" />
          <span className="text-[0.6875rem] font-bold tracking-[0.08em] uppercase">
            Docsy
          </span>
        </MessageHeader>

        <Bubble variant="ghost">
          <BubbleContent className="text-base leading-relaxed">
            {withCitations(message.content)}
          </BubbleContent>
        </Bubble>

        {message.sources && (
          <>
            <Separator />

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[0.6875rem] font-bold tracking-[0.08em] text-muted-foreground uppercase">
                Sources
              </span>

              {message.sources.map((source) => (
                <span
                  key={source.index}
                  className="flex items-center gap-2 rounded-lg border bg-surface px-2.5 py-1.5 text-sm"
                >
                  <span className="font-mono text-xs font-semibold text-brand">
                    [{source.index}]
                  </span>
                  {source.document} · p.{source.page}
                </span>
              ))}
            </div>

            <MessageFooter className="gap-1 px-0">
              <Button
                variant="outline"
                size="icon-sm"
                className="cursor-pointer"
                aria-label="Copy answer"
              >
                <CopyIcon />
              </Button>
              <Button
                variant="outline"
                size="icon-sm"
                className="cursor-pointer"
                aria-label="Helpful"
              >
                <ThumbsUpIcon />
              </Button>
              <Button
                variant="outline"
                size="icon-sm"
                className="cursor-pointer"
                aria-label="Not helpful"
              >
                <ThumbsDownIcon />
              </Button>
            </MessageFooter>
          </>
        )}
      </MessageContent>
    </Message>
  )
}

/** An open chat — `ui-design/dashboard/light/chat-page-chat.png`. */
function ChatConversation({ chat }: { chat: Chat }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <MessageScrollerProvider autoScroll>
        <MessageScroller className="flex-1">
          <MessageScrollerViewport className="px-6">
            <MessageScrollerContent className="mx-auto w-full max-w-3xl py-8">
              {chat.messages.map((message) => (
                <MessageScrollerItem
                  key={message.id}
                  messageId={message.id}
                  scrollAnchor={message.role === "user"}
                >
                  <ChatTurn message={message} />
                </MessageScrollerItem>
              ))}
            </MessageScrollerContent>
          </MessageScrollerViewport>

          <MessageScrollerButton />
        </MessageScroller>
      </MessageScrollerProvider>

      <div className="shrink-0 px-6 pb-4">
        <div className="mx-auto w-full max-w-3xl">
          <ChatComposer
            tone="outline"
            placeholder="Ask a follow-up about your documents…"
            footer={
              <>
                <InputGroupButton
                  size="icon-sm"
                  variant="ghost"
                  className="cursor-pointer"
                  aria-label="Attach a document"
                >
                  <PaperclipIcon />
                </InputGroupButton>

                <InputGroupButton
                  variant="outline"
                  className="cursor-pointer"
                  aria-label="Choose which documents to search"
                >
                  <LayersIcon />
                  All {chat.documents} documents
                  <ChevronDownIcon />
                </InputGroupButton>

                <span className="ml-auto font-mono text-xs text-muted-foreground">
                  {chat.questionsUsed} / {MONTHLY_QUESTION_LIMIT} questions
                </span>
              </>
            }
          />

          <p className="mt-2 text-center text-xs text-muted-foreground">
            Docsy answers only from your documents and cites every claim.
          </p>
        </div>
      </div>
    </div>
  )
}

export { ChatConversation }

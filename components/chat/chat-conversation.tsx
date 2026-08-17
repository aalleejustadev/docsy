"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { PaperclipIcon } from "lucide-react"

import {
  allowanceSpentMessage,
  chatRoute,
  formatQuestionCount,
  type ChatDetail,
  type ChatMessageView,
  type ChatSource,
} from "@/lib/chat"
import { cn } from "@/lib/utils"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Bubble, BubbleContent } from "@/components/ui/bubble"
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
import { TypingDots } from "@/components/common/typing-dots"
import { AnswerActions } from "@/components/chat/answer-actions"
import { AttachDocumentsDialog } from "@/components/chat/attach-documents-dialog"
import { DocumentScope } from "@/components/chat/document-scope"
import {
  SourceReader,
  type ActiveCitation,
} from "@/components/chat/source-reader"
import { AnswerMarkdown } from "@/components/chat/answer-markdown"
import { ChatComposer } from "@/components/chat/chat-composer"

function AnswerBody({
  content,
  sources,
  onSelectSource,
}: {
  content: string
  sources: ChatSource[]
  /** Omitted while streaming, when the sources aren't resolved yet. */
  onSelectSource?: (citation: ActiveCitation) => void
}) {
  // A marker addresses a source by number and a passage by position; both have
  // to be resolved against this answer's own sources before the reader can
  // show anything.
  const selectByMarker = React.useMemo(() => {
    if (!onSelectSource) return undefined

    return (index: number, passage: number | null) => {
      const source = sources.find((candidate) => candidate.index === index)
      if (source) onSelectSource({ source, passage })
    }
  }, [sources, onSelectSource])

  return (
    <>
      <Bubble variant="ghost">
        <BubbleContent className="text-base">
          <AnswerMarkdown onCitationSelect={selectByMarker}>
            {content}
          </AnswerMarkdown>
        </BubbleContent>
      </Bubble>

      {sources.length > 0 && (
        <>
          <Separator />

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[0.6875rem] font-bold tracking-[0.08em] text-muted-foreground uppercase">
              Sources
            </span>

            {sources.map((source) => (
              <button
                key={source.index}
                type="button"
                onClick={() => onSelectSource?.({ source, passage: 0 })}
                disabled={!onSelectSource}
                className="flex cursor-pointer items-center gap-2 rounded-lg border bg-surface px-2.5 py-1.5 text-sm transition-colors hover:border-brand disabled:cursor-default disabled:hover:border-border"
              >
                <span className="font-mono text-xs font-semibold text-brand">
                  [{source.index}]
                </span>
                {source.document}
                {source.page !== null && ` · p.${source.page}`}
              </button>
            ))}
          </div>
        </>
      )}
    </>
  )
}

function AssistantTurn({
  children,
  actions,
}: {
  children: React.ReactNode
  /** Omitted while an answer is still streaming — there's nothing to copy yet. */
  actions?: React.ReactNode
}) {
  return (
    <Message align="start">
      <MessageContent className="gap-3">
        <MessageHeader className="gap-2 px-0">
          <DocsyMark className="size-5" />
          <span className="text-[0.6875rem] font-bold tracking-[0.08em] uppercase">
            Docsy
          </span>
        </MessageHeader>

        {children}

        {actions && <MessageFooter className="px-0">{actions}</MessageFooter>}
      </MessageContent>
    </Message>
  )
}

function ChatTurn({
  message,
  chatId,
  onSelectSource,
}: {
  message: ChatMessageView
  chatId: string
  onSelectSource: (citation: ActiveCitation) => void
}) {
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
    <AssistantTurn
      actions={
        <AnswerActions
          chatId={chatId}
          messageId={message.id}
          content={message.content}
          feedback={message.feedback}
        />
      }
    >
      <AnswerBody
        content={message.content}
        sources={message.sources}
        onSelectSource={onSelectSource}
      />
    </AssistantTurn>
  )
}

/** An open chat — `ui-design/dashboard/light/chat-page-chat.png`. */
function ChatConversation({ chat }: { chat: ChatDetail }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  /**
   * A question carried in on the URL — from the command palette, which only
   * prefills, or from the search page's "Ask Docsy" card, which asks outright.
   *
   * Captured once at mount rather than read on every render: the parameters
   * are stripped from the URL as soon as the question is sent, and re-reading
   * them would turn that cleanup into "the question vanished".
   */
  const [carried] = React.useState(() => {
    const question = searchParams.get("q")?.trim() ?? ""

    return {
      question,
      // Never while something is already in flight: the seeded brief analysis
      // gets the first turn, and the question waits in the composer instead of
      // racing it.
      autoAsk:
        question.length > 0 &&
        searchParams.get("ask") === "1" &&
        !chat.pendingAnswer,
    }
  })

  // An auto-asked question is part of the opening state rather than something
  // pushed in by an effect, so the thread renders with it already in place —
  // no empty-then-populated flash, and no setState during mount.
  const [messages, setMessages] = React.useState<ChatMessageView[]>(() =>
    carried.autoAsk
      ? [
          ...chat.messages,
          {
            id: "carried-question",
            role: "user",
            content: carried.question,
            sources: [],
            feedback: null,
          },
        ]
      : chat.messages
  )
  const [streamed, setStreamed] = React.useState("")
  const [isAnswering, setIsAnswering] = React.useState(
    chat.pendingAnswer || carried.autoAsk
  )
  const [error, setError] = React.useState<string | null>(null)
  const [isAttachOpen, setIsAttachOpen] = React.useState(false)
  // Tracked as what's been *excluded* rather than what's selected, so a
  // document attached mid-chat joins the scope automatically and a stale id
  // from a detached one simply falls out. Held in the page rather than stored,
  // because a scope is about the question being asked, not the chat.
  const [excluded, setExcluded] = React.useState<string[]>([])

  const scope = chat.documents
    .map((document) => document.id)
    .filter((id) => !excluded.includes(id))

  // A stable dependency for the send callback: the array itself is rebuilt
  // every render, so depending on it directly would rebuild the callback too.
  const scopeKey = scope.join(",")

  // The server's monthly figure is a snapshot from page load, so asking a
  // question has to show up before the refresh lands. Deriving the difference
  // from `messages` rather than holding a counter means it self-corrects: once
  // the refresh arrives, the new question is in both halves and the local
  // adjustment falls back to zero on its own.
  const questionsAsked = (list: ChatMessageView[]) =>
    list.filter((message) => message.role === "user").length

  const questionsThisMonth =
    chat.questionsThisMonth +
    Math.max(0, questionsAsked(messages) - questionsAsked(chat.messages))

  // The server decides this for real — see the messages route. Here it only
  // has to stop the composer offering a question that would be refused. The
  // ceiling arrives with the chat, because it depends on the workspace's plan.
  const allowanceSpent = questionsThisMonth >= chat.questionLimit
  const [activeCitation, setActiveCitation] =
    React.useState<ActiveCitation | null>(() => {
      const source = [...chat.messages]
        .reverse()
        .find((message) => message.sources.length > 0)?.sources[0]

      return source ? { source, passage: 0 } : null
    })

  // React 18 mounts effects twice in dev; without this the seeded analysis
  // would be requested — and billed — twice on every load.
  const requested = React.useRef(false)

  const answer = React.useCallback(
    async (question?: string) => {
      let text = ""

      try {
        const response = await fetch(`/api/chats/${chat.id}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...(question ? { question } : {}),
            documentIds: scopeKey.split(","),
          }),
        })

        if (!response.ok || !response.body) {
          const detail = await response.json().catch(() => null)
          setError(detail?.error ?? "Couldn't reach Docsy.")
          setIsAnswering(false)
          return
        }

        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ""

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split("\n")
          // The tail is whatever arrived after the last newline — an incomplete
          // event, so it waits for the next chunk rather than failing to parse.
          buffer = lines.pop() ?? ""

          for (const line of lines) {
            if (!line.trim()) continue

            const event = JSON.parse(line)

            if (event.type === "text") {
              text += event.value
              setStreamed(text)
            }

            if (event.type === "error") {
              // A refusal can arrive after partial text; that partial isn't a
              // real answer, so it goes rather than being left on screen.
              setStreamed("")
              setError(event.value)
              setIsAnswering(false)
              return
            }

            if (event.type === "done") {
              setMessages((current) => [
                ...current,
                {
                  id: event.messageId as string,
                  role: "assistant",
                  content: text,
                  sources: event.sources as ChatSource[],
                  feedback: null,
                },
              ])
              setStreamed("")
              setIsAnswering(false)
              const answered = event.sources as ChatSource[]
              if (answered.length > 0) {
                setActiveCitation({ source: answered[0], passage: 0 })
              }
              // Pulls the saved ids and re-sorts the sidebar.
              router.refresh()
              return
            }
          }
        }

        setError("The answer stopped early. Ask again to retry.")
        setIsAnswering(false)
      } catch {
        setError("The connection dropped before the answer finished.")
        setIsAnswering(false)
      }
    },
    [chat.id, router, scopeKey]
  )

  /**
   * Fires the one answer this mount owes: the seeded brief analysis, or a
   * question carried in from the search page. The ref guards both — React
   * mounts effects twice in dev, and either would otherwise be billed twice.
   */
  const outstanding = chat.pendingAnswer || carried.autoAsk

  React.useEffect(() => {
    if (!outstanding || requested.current) return

    requested.current = true
    void answer(carried.autoAsk ? carried.question : undefined)

    // The question is in the thread now, so the URL shouldn't keep carrying
    // it — a reload would otherwise ask it, and bill it, all over again.
    //
    // `history.replaceState` rather than `router.replace`: this is the same
    // page with a parameter dropped, and Next syncs it into the router
    // without a server round trip. `router.replace` re-renders the route,
    // which in practice left the question in the URL for seconds after it had
    // already been asked — exactly the window a reload must not land in.
    if (carried.autoAsk) {
      window.history.replaceState(null, "", chatRoute(chat.id))
    }
  }, [outstanding, carried, answer, chat.id])

  function ask(question: string) {
    setError(null)
    setMessages((current) => [
      ...current,
      {
        id: `question-${current.length}`,
        role: "user",
        content: question,
        sources: [],
        feedback: null,
      },
    ])
    setIsAnswering(true)
    void answer(question)
  }

  return (
    <div className="flex min-h-0 flex-1">
      <div className="flex min-w-0 flex-1 flex-col">
        <MessageScrollerProvider autoScroll>
          <MessageScroller className="flex-1">
            {/* The viewport is `tabindex=0` so it can be arrow-scrolled, which
              means the browser rings the whole pane once it takes focus. The
              ring is dropped here — it reads as a stray border around the
              thread, and every control inside keeps its own focus ring. */}
            <MessageScrollerViewport className="px-6 outline-none">
              <MessageScrollerContent className="mx-auto w-full max-w-3xl py-8">
                {messages.map((message) => (
                  <MessageScrollerItem
                    key={message.id}
                    messageId={message.id}
                    scrollAnchor={message.role === "user"}
                  >
                    <ChatTurn
                      message={message}
                      chatId={chat.id}
                      onSelectSource={setActiveCitation}
                    />
                  </MessageScrollerItem>
                ))}

                {isAnswering && (
                  <MessageScrollerItem messageId="answering">
                    <AssistantTurn>
                      {streamed ? (
                        <AnswerBody content={streamed} sources={[]} />
                      ) : (
                        <Bubble variant="ghost">
                          <BubbleContent className="flex items-center gap-2 text-sm text-muted-foreground">
                            Reading your document
                            <TypingDots />
                          </BubbleContent>
                        </Bubble>
                      )}
                    </AssistantTurn>
                  </MessageScrollerItem>
                )}

                {error && (
                  <MessageScrollerItem messageId="error">
                    <Alert variant="destructive">
                      <AlertTitle>Docsy couldn&apos;t answer</AlertTitle>
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  </MessageScrollerItem>
                )}
              </MessageScrollerContent>
            </MessageScrollerViewport>

            <MessageScrollerButton />
          </MessageScroller>
        </MessageScrollerProvider>

        <div className="shrink-0 px-6 pb-4">
          <div className="mx-auto w-full max-w-3xl">
            <ChatComposer
              tone="outline"
              // The server refuses either way; this is so a spent allowance
              // reads as spent rather than as a question that vanished.
              disabled={isAnswering || allowanceSpent}
              onSend={ask}
              // Only the prefill case: an auto-asked question is already in
              // the thread, and leaving a copy here invites asking it twice.
              defaultValue={carried.autoAsk ? "" : carried.question}
              placeholder={
                allowanceSpent
                  ? allowanceSpentMessage(chat.questionLimit)
                  : "Ask a follow-up about your documents…"
              }
              footer={
                <>
                  <InputGroupButton
                    size="icon-sm"
                    variant="ghost"
                    className="cursor-pointer"
                    aria-label="Attach a document"
                    onClick={() => setIsAttachOpen(true)}
                  >
                    <PaperclipIcon />
                  </InputGroupButton>

                  <DocumentScope
                    documents={chat.documents}
                    selected={scope}
                    onChange={(next) =>
                      setExcluded(
                        chat.documents
                          .map((document) => document.id)
                          .filter((id) => !next.includes(id))
                      )
                    }
                    disabled={isAnswering}
                  />

                  <span
                    className={cn(
                      "ml-auto font-mono text-xs text-muted-foreground",
                      allowanceSpent && "text-destructive"
                    )}
                  >
                    {formatQuestionCount(
                      questionsThisMonth,
                      chat.questionLimit
                    )}
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

      <SourceReader
        citation={activeCitation}
        onDismiss={() => setActiveCitation(null)}
      />

      <AttachDocumentsDialog
        chatId={chat.id}
        attachedIds={chat.documents.map((document) => document.id)}
        open={isAttachOpen}
        onOpenChange={setIsAttachOpen}
      />
    </div>
  )
}

export { ChatConversation }

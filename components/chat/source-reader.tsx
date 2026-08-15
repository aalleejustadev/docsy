"use client"

import * as React from "react"
import { ExternalLinkIcon, FileTextIcon } from "lucide-react"

import { useMediaQuery } from "@/hooks/use-media-query"
import type { ChatSource } from "@/lib/chat"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"

/** Which citation the reader is showing: a source, and the passage within it. */
export type ActiveCitation = {
  source: ChatSource
  /** Null for markers written before passages were recorded. */
  passage: number | null
}

/**
 * Stand-in for the document text around a quote.
 *
 * Used for PDFs, whose text we deliberately never extract — Claude reads those
 * natively, so there is nothing on our side to show around the passage. The
 * bars say "there is more document here" without inventing what it says.
 */
function ContextPlaceholder({ lines }: { lines: number[] }) {
  return (
    <div className="flex flex-col gap-2" aria-hidden="true">
      {lines.map((width, index) => (
        <Skeleton
          key={index}
          className="h-2.5 rounded-full"
          style={{ width: `${width}%` }}
        />
      ))}
    </div>
  )
}

/**
 * The cited passage, with whatever document text sits either side of it —
 * `ui-design/dashboard/light/chat-page-chat.png`.
 *
 * The clicked one is highlighted; the rest stay legible but recede, so a
 * document cited many times still reads as one continuous excerpt.
 */
function Passage({
  passage,
  isActive,
}: {
  passage: ChatSource["passages"][number]
  isActive: boolean
}) {
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!isActive) return

    ref.current?.scrollIntoView({ block: "center", behavior: "smooth" })
  }, [isActive])

  return (
    <div ref={ref} className="flex flex-col gap-3">
      {passage.before ? (
        <p className="text-sm leading-relaxed text-muted-foreground">
          …{passage.before}
        </p>
      ) : (
        <ContextPlaceholder lines={[100, 92, 78]} />
      )}

      <blockquote
        className={cn(
          "border-s-[3px] px-4 py-3 text-sm leading-relaxed transition-colors",
          isActive
            ? "border-brand bg-brand/10 text-foreground"
            : "border-border bg-surface text-muted-foreground"
        )}
      >
        {passage.text}
      </blockquote>

      {passage.after ? (
        <p className="text-sm leading-relaxed text-muted-foreground">
          {passage.after}…
        </p>
      ) : (
        <ContextPlaceholder lines={[100, 88, 95, 70, 60]} />
      )}
    </div>
  )
}

/** Everything inside the reader, shared by the docked column and the sheet. */
function ReaderBody({ citation }: { citation: ActiveCitation | null }) {
  const source = citation?.source ?? null

  if (!source) {
    return (
      <div className="flex flex-1 items-center justify-center px-6 text-center">
        <p className="text-sm text-balance text-muted-foreground">
          Select a citation in an answer to read the passage it came from.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="flex shrink-0 items-center gap-2.5 border-b px-4 py-3.5">
        <FileTextIcon className="size-4 shrink-0 text-muted-foreground" />
        <span className="min-w-0 flex-1 truncate text-sm font-semibold">
          {source.document}
        </span>
        {source.page !== null && (
          <span className="shrink-0 font-mono text-xs text-muted-foreground">
            p.{source.page}
          </span>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        {source.passages.length === 0 ? (
          // Answers written before the reader existed kept only the reference,
          // not the wording behind it.
          <p className="text-sm text-muted-foreground">
            This answer was written before Docsy started keeping the quoted
            passages. Ask the question again to see them here.
          </p>
        ) : (
          <div className="flex flex-col gap-6">
            {source.passages.map((passage, index) => (
              <Passage
                // Keyed by source and position so switching sources remounts,
                // which re-runs the scroll into view.
                key={`${source.index}-${index}`}
                passage={passage}
                // With no passage on the marker, the first stands in.
                isActive={index === (citation?.passage ?? 0)}
              />
            ))}
          </div>
        )}
      </div>

      {source.documentId && (
        <div className="shrink-0 border-t p-4">
          <Button
            variant="outline"
            size="lg"
            className="w-full cursor-pointer"
            render={
              <a
                href={`/api/documents/${source.documentId}`}
                target="_blank"
                rel="noreferrer noopener"
              />
            }
            nativeButton={false}
          >
            <ExternalLinkIcon />
            Open full document
          </Button>
        </div>
      )}
    </>
  )
}

function ReaderHeading({ source }: { source: ChatSource | null }) {
  return (
    <>
      <span className="text-[0.6875rem] font-bold tracking-[0.08em] text-muted-foreground uppercase">
        Source reader
      </span>

      {source && (
        <Badge
          variant="outline"
          className="ml-auto rounded-md border-brand/40 font-mono text-[0.625rem] font-semibold tracking-wider text-brand"
        >
          [{source.index}]
        </Badge>
      )}
    </>
  )
}

/**
 * The right-hand reader — `ui-design/dashboard/light/chat-page-chat.png`.
 *
 * Shows which document a `[n]` marker points at, which page, and the exact
 * passage behind the marker that was clicked.
 *
 * Docked beside the thread when there's room for it. Below `xl` there isn't,
 * so the same panel slides in as a sheet instead — clicking a citation has to
 * show its evidence at every width, or the citation stops being trustworthy.
 */
function SourceReader({
  citation,
  onDismiss,
}: {
  citation: ActiveCitation | null
  /** Clears the selection when the sheet is closed. */
  onDismiss: () => void
}) {
  const isDocked = useMediaQuery("(min-width: 80rem)")

  if (isDocked) {
    return (
      <aside className="hidden w-96 shrink-0 flex-col border-s bg-background xl:flex">
        <div className="flex h-12 shrink-0 items-center gap-3 border-b px-4">
          <ReaderHeading source={citation?.source ?? null} />
        </div>

        <ReaderBody citation={citation} />
      </aside>
    )
  }

  return (
    <Sheet
      open={citation !== null}
      onOpenChange={(open) => {
        if (!open) onDismiss()
      }}
    >
      <SheetContent
        side="right"
        className="flex w-full flex-col p-0 sm:max-w-96"
      >
        <SheetHeader className="h-12 shrink-0 flex-row items-center gap-3 border-b px-4">
          {/* `Sheet` needs a title for screen readers; the visible heading is
              the same row, so it doubles as one. */}
          <SheetTitle className="contents">
            <ReaderHeading source={citation?.source ?? null} />
          </SheetTitle>
        </SheetHeader>

        <ReaderBody citation={citation} />
      </SheetContent>
    </Sheet>
  )
}

export { SourceReader }

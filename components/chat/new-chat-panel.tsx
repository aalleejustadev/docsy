"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { LibraryIcon, UploadIcon } from "lucide-react"

import {
  chatRoute,
  DOCUMENT_ACCEPT,
  DOCUMENT_FORMATS_LABEL,
  MAX_DOCUMENTS_PER_CHAT,
  type LibraryDocumentView,
} from "@/lib/chat"
import { cn } from "@/lib/utils"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Marker, MarkerContent } from "@/components/ui/marker"
import { Spinner } from "@/components/ui/spinner"
import { DocsyMark } from "@/components/brand/docsy-logo"
import { ChatComposer } from "@/components/chat/chat-composer"
import { LibraryPickerDialog } from "@/components/chat/library-picker-dialog"

/**
 * A chat before it has any documents — `ui-design/dashboard/light/chat-main.png`.
 *
 * Providing a document *is* the action: as soon as one lands, the chat is
 * created and the developer is taken to the thread, where the brief analysis
 * streams in. That's why the composer here stays disabled — there's nothing to
 * ask until Docsy has something to read.
 */
function NewChatPanel({ documents }: { documents: LibraryDocumentView[] }) {
  const router = useRouter()
  const [isDragging, setIsDragging] = React.useState(false)
  const [isLibraryOpen, setIsLibraryOpen] = React.useState(false)
  const [busy, setBusy] = React.useState<string | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  async function startChat(documentIds: string[]) {
    setBusy("Opening the chat…")

    const response = await fetch("/api/chats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ documentIds }),
    })

    if (!response.ok) {
      const detail = await response.json().catch(() => null)
      setError(detail?.error ?? "Couldn't start that chat.")
      setBusy(null)
      return
    }

    const chat = (await response.json()) as { id: string }

    // No `setBusy(null)`: the navigation replaces this screen, and clearing it
    // first would flash the empty state on the way out.
    router.push(chatRoute(chat.id))
  }

  async function uploadAndStart(files: File[]) {
    if (files.length === 0) return

    setError(null)
    const uploaded: string[] = []

    for (const [index, file] of files
      .slice(0, MAX_DOCUMENTS_PER_CHAT)
      .entries()) {
      setBusy(
        files.length > 1
          ? `Reading ${file.name} (${index + 1} of ${files.length})…`
          : `Reading ${file.name}…`
      )

      const form = new FormData()
      form.append("file", file)

      const response = await fetch("/api/documents", {
        method: "POST",
        body: form,
      })

      if (!response.ok) {
        const detail = await response.json().catch(() => null)
        setError(detail?.error ?? `Couldn't read ${file.name}.`)
        setBusy(null)
        return
      }

      const document = (await response.json()) as LibraryDocumentView
      uploaded.push(document.id)
    }

    await startChat(uploaded)
  }

  const isBusy = busy !== null

  return (
    <div
      className="flex min-h-0 flex-1 flex-col"
      onDragOver={(event) => {
        event.preventDefault()
        if (!isBusy) setIsDragging(true)
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(event) => {
        event.preventDefault()
        setIsDragging(false)
        if (!isBusy) void uploadAndStart(Array.from(event.dataTransfer.files))
      }}
    >
      <div className="flex flex-1 items-center justify-center overflow-y-auto px-6 py-10">
        <Empty className="max-w-xl p-0">
          <EmptyHeader className="max-w-lg">
            <EmptyMedia>
              <DocsyMark className="size-12" />
            </EmptyMedia>

            <EmptyTitle className="text-2xl font-bold">
              Add documents to start
            </EmptyTitle>

            <EmptyDescription>
              Docsy only answers from sources you provide, with a citation for
              every claim. Attach at least one document to begin this chat.
            </EmptyDescription>
          </EmptyHeader>

          <EmptyContent className="max-w-none gap-4">
            {error && (
              <Alert variant="destructive" className="text-left">
                <AlertTitle>That didn&apos;t work</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <button
              type="button"
              disabled={isBusy}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "flex w-full cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed bg-surface px-6 py-10 text-center transition-colors hover:border-brand disabled:cursor-not-allowed disabled:opacity-70",
                isDragging && "border-brand bg-accent/40"
              )}
            >
              {isBusy ? (
                <>
                  <Spinner className="size-5 text-muted-foreground" />
                  <span className="font-semibold">{busy}</span>
                  <span className="text-sm text-muted-foreground">
                    Large briefs take a few seconds to read.
                  </span>
                </>
              ) : (
                <>
                  <UploadIcon className="size-5 text-muted-foreground" />
                  <span className="font-semibold">
                    Drop files here or click to upload
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {DOCUMENT_FORMATS_LABEL}
                  </span>
                </>
              )}
            </button>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={DOCUMENT_ACCEPT}
              className="sr-only"
              onChange={(event) => {
                const files = Array.from(event.target.files ?? [])
                // Reset so re-picking the same file still fires `change`.
                event.target.value = ""
                void uploadAndStart(files)
              }}
            />

            <Marker variant="separator">
              <MarkerContent className="text-xs">OR</MarkerContent>
            </Marker>

            <Button
              variant="outline"
              size="lg"
              className="w-full cursor-pointer"
              disabled={isBusy}
              onClick={() => setIsLibraryOpen(true)}
            >
              <LibraryIcon />
              Choose from Library
            </Button>
          </EmptyContent>
        </Empty>
      </div>

      <div className="shrink-0 px-6 pb-6">
        <div className="mx-auto w-full max-w-3xl">
          <ChatComposer
            disabled
            placeholder="Add a document to ask your first question…"
          />
        </div>
      </div>

      <LibraryPickerDialog
        open={isLibraryOpen}
        onOpenChange={setIsLibraryOpen}
        documents={documents}
        addedIds={[]}
        onAdd={(picked) => {
          setError(null)
          void startChat(picked.map((document) => document.id))
        }}
      />
    </div>
  )
}

export { NewChatPanel }

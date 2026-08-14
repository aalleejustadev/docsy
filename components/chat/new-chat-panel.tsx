"use client"

import * as React from "react"
import { FileTextIcon, LibraryIcon, UploadIcon, XIcon } from "lucide-react"

import {
  DOCUMENT_ACCEPT,
  DOCUMENT_FORMATS_LABEL,
  MAX_DOCUMENTS_PER_CHAT,
} from "@/lib/chat"
import { cn } from "@/lib/utils"
import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentTitle,
} from "@/components/ui/attachment"
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
import { DocsyMark } from "@/components/brand/docsy-logo"
import { ChatComposer } from "@/components/chat/chat-composer"

type PendingDocument = {
  /** Name + size + mtime — enough to spot the same file picked twice. */
  id: string
  name: string
  size: number
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/**
 * A chat before it has any documents — `ui-design/dashboard/light/chat-main.png`.
 * Docsy answers only from sources you provide, so the upload is the gate: the
 * composer stays disabled until at least one document is attached.
 */
function NewChatPanel() {
  const [documents, setDocuments] = React.useState<PendingDocument[]>([])
  const [isDragging, setIsDragging] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const hasDocuments = documents.length > 0

  function addFiles(files: FileList | null) {
    if (!files?.length) return

    const incoming = Array.from(files).map((file) => ({
      id: `${file.name}-${file.size}-${file.lastModified}`,
      name: file.name,
      size: file.size,
    }))

    setDocuments((current) => {
      const merged = [...current]

      for (const document of incoming) {
        if (!merged.some((existing) => existing.id === document.id)) {
          merged.push(document)
        }
      }

      return merged.slice(0, MAX_DOCUMENTS_PER_CHAT)
    })
  }

  function removeDocument(id: string) {
    setDocuments((current) => current.filter((document) => document.id !== id))
  }

  return (
    <div
      className="flex min-h-0 flex-1 flex-col"
      onDragOver={(event) => {
        event.preventDefault()
        setIsDragging(true)
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(event) => {
        event.preventDefault()
        setIsDragging(false)
        addFiles(event.dataTransfer.files)
      }}
    >
      <div className="flex flex-1 items-center justify-center overflow-y-auto px-6 py-10">
        <Empty className="max-w-xl p-0">
          <EmptyHeader className="max-w-lg">
            <EmptyMedia>
              <DocsyMark className="size-12" />
            </EmptyMedia>

            <EmptyTitle className="text-2xl font-bold">
              {hasDocuments ? "Ready when you are" : "Add documents to start"}
            </EmptyTitle>

            <EmptyDescription>
              {hasDocuments
                ? "Ask your first question below. Every claim in the answer will point back to one of these documents."
                : "Docsy only answers from sources you provide, with a citation for every claim. Attach at least one document to begin this chat."}
            </EmptyDescription>
          </EmptyHeader>

          <EmptyContent className="max-w-none gap-4">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "flex w-full cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed bg-surface px-6 py-10 text-center transition-colors hover:border-brand",
                isDragging && "border-brand bg-accent/40"
              )}
            >
              <UploadIcon className="size-5 text-muted-foreground" />
              <span className="font-semibold">
                Drop files here or click to upload
              </span>
              <span className="text-sm text-muted-foreground">
                {DOCUMENT_FORMATS_LABEL}
              </span>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={DOCUMENT_ACCEPT}
              className="sr-only"
              onChange={(event) => {
                addFiles(event.target.files)
                // Reset so re-picking the same file still fires `change`.
                event.target.value = ""
              }}
            />

            {hasDocuments && (
              <AttachmentGroup className="w-full">
                {documents.map((document) => (
                  <Attachment key={document.id} state="idle" size="sm">
                    <AttachmentMedia variant="icon">
                      <FileTextIcon />
                    </AttachmentMedia>

                    <AttachmentContent>
                      <AttachmentTitle>{document.name}</AttachmentTitle>
                      <AttachmentDescription>
                        {formatSize(document.size)}
                      </AttachmentDescription>
                    </AttachmentContent>

                    <AttachmentActions>
                      <AttachmentAction
                        aria-label={`Remove ${document.name}`}
                        onClick={() => removeDocument(document.id)}
                      >
                        <XIcon />
                      </AttachmentAction>
                    </AttachmentActions>
                  </Attachment>
                ))}
              </AttachmentGroup>
            )}

            <Marker variant="separator">
              <MarkerContent className="text-xs">OR</MarkerContent>
            </Marker>

            {/* Waits on the picker in `choose-from-library-modal.png`. */}
            <Button
              variant="outline"
              size="lg"
              className="w-full cursor-pointer"
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
            disabled={!hasDocuments}
            placeholder={
              hasDocuments
                ? "Ask your first question…"
                : "Add a document to ask your first question…"
            }
          />
        </div>
      </div>
    </div>
  )
}

export { NewChatPanel }

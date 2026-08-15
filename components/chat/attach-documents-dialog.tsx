"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { LibraryIcon } from "lucide-react"

import { MAX_DOCUMENTS_PER_CHAT, type LibraryDocumentView } from "@/lib/chat"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Marker, MarkerContent } from "@/components/ui/marker"
import { toast } from "@/components/ui/toast"
import { DocumentDropzone } from "@/components/chat/document-dropzone"
import { LibraryPickerDialog } from "@/components/chat/library-picker-dialog"

/**
 * Adds documents to a chat that's already running — the composer's paperclip.
 *
 * Two ways in, matching the new-chat screen: upload a file, or pick something
 * already in the library. Upload and attach are separate steps server-side, so
 * anything uploaded here also lands in the library for the next chat.
 */
function AttachDocumentsDialog({
  chatId,
  attachedIds,
  open,
  onOpenChange,
}: {
  chatId: string
  /** Already on this chat — the picker shows them as added, not selectable. */
  attachedIds: string[]
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const router = useRouter()
  const [busy, setBusy] = React.useState<string | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [isLibraryOpen, setIsLibraryOpen] = React.useState(false)
  const [library, setLibrary] = React.useState<LibraryDocumentView[]>([])

  // Loaded when the dialog opens rather than passed down with the chat, so it
  // includes anything uploaded since the page rendered.
  React.useEffect(() => {
    if (!open) return

    let cancelled = false

    void (async () => {
      const response = await fetch("/api/documents")
      if (!response.ok || cancelled) return

      setLibrary((await response.json()) as LibraryDocumentView[])
    })()

    return () => {
      cancelled = true
    }
  }, [open])

  /** The step both paths share once there are ids to link. */
  async function attach(documentIds: string[]) {
    setBusy("Attaching to this chat…")

    const response = await fetch(`/api/chats/${chatId}/documents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ documentIds }),
    })

    if (!response.ok) {
      const detail = await response.json().catch(() => null)
      setError(detail?.error ?? "Couldn't attach those documents.")
      setBusy(null)
      return
    }

    const { attached } = (await response.json()) as { attached: number }

    toast.add({
      title:
        attached === 0
          ? "Already attached to this chat."
          : `${attached} document${attached === 1 ? "" : "s"} attached.`,
      description:
        attached === 0
          ? undefined
          : "Your next question will be answered from them too.",
    })

    setBusy(null)
    onOpenChange(false)
    // Refreshes the document count in the composer, and makes the new source
    // available to the next answer.
    router.refresh()
  }

  async function upload(files: File[]) {
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

    await attach(uploaded)
  }

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          // Closing mid-upload would leave the request running with nothing
          // listening for its result.
          if (busy) return
          setError(null)
          onOpenChange(next)
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Attach documents</DialogTitle>
            <DialogDescription>
              They join this chat as sources, and stay in your library for the
              next one.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            {error && (
              <Alert variant="destructive">
                <AlertTitle>That didn&apos;t work</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <DocumentDropzone
              busy={busy}
              onFiles={(files) => void upload(files)}
            />

            <Marker variant="separator">
              <MarkerContent className="text-xs">OR</MarkerContent>
            </Marker>

            <Button
              variant="outline"
              size="lg"
              className="w-full cursor-pointer"
              disabled={busy !== null}
              onClick={() => {
                // Handing over rather than stacking: two modals at once means
                // two overlays and a fight over the focus trap.
                setError(null)
                onOpenChange(false)
                setIsLibraryOpen(true)
              }}
            >
              <LibraryIcon />
              Choose from Library
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <LibraryPickerDialog
        open={isLibraryOpen}
        onOpenChange={setIsLibraryOpen}
        documents={library}
        addedIds={attachedIds}
        onAdd={(picked) => {
          setError(null)
          void attach(picked.map((document) => document.id))
        }}
      />
    </>
  )
}

export { AttachDocumentsDialog }

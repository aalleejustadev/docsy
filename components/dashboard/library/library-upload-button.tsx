"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { UploadIcon } from "lucide-react"

import { DOCUMENT_ACCEPT } from "@/lib/chat"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "@/components/ui/toast"

/**
 * "Upload documents" — the one action on the library page.
 *
 * Files go up one at a time rather than in a single request: extraction runs
 * inline on the server, and a serial loop means a 12 MB scan that fails takes
 * the others down with it. Each failure is reported by name, the run keeps
 * going, and the page is refreshed once at the end so the table and the
 * sidebar counts both catch up.
 */
function LibraryUploadButton() {
  const router = useRouter()
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [progress, setProgress] = React.useState<string | null>(null)

  async function upload(files: File[]) {
    if (files.length === 0) return

    let uploaded = 0

    for (const [index, file] of files.entries()) {
      setProgress(
        files.length === 1
          ? "Reading document…"
          : `Reading ${index + 1} of ${files.length}…`
      )

      const body = new FormData()
      body.append("file", file)

      try {
        const response = await fetch("/api/documents", { method: "POST", body })

        if (!response.ok) {
          const detail = await response.json().catch(() => null)

          toast.add({
            title: `Couldn't add ${file.name}.`,
            description: detail?.error ?? "Try again in a moment.",
          })
          continue
        }

        uploaded += 1
      } catch {
        toast.add({
          title: `Couldn't add ${file.name}.`,
          description: "Check your connection and try again.",
        })
      }
    }

    setProgress(null)

    if (uploaded > 0) {
      toast.add({
        title: `${uploaded} document${uploaded === 1 ? "" : "s"} added to your library.`,
        description: "Indexed and ready to be asked about.",
      })

      router.refresh()
    }
  }

  return (
    <>
      <Button
        size="lg"
        disabled={progress !== null}
        onClick={() => inputRef.current?.click()}
        className="h-10 cursor-pointer px-4"
      >
        {progress ? (
          <Spinner data-icon="inline-start" />
        ) : (
          <UploadIcon data-icon="inline-start" />
        )}
        {progress ?? "Upload documents"}
      </Button>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept={DOCUMENT_ACCEPT}
        className="sr-only"
        onChange={(event) => {
          const files = Array.from(event.target.files ?? [])
          // Reset so re-picking the same file still fires `change`.
          event.target.value = ""
          upload(files)
        }}
      />
    </>
  )
}

export { LibraryUploadButton }

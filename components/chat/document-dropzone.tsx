"use client"

import * as React from "react"
import { UploadIcon } from "lucide-react"

import { DOCUMENT_ACCEPT, DOCUMENT_FORMATS_LABEL } from "@/lib/chat"
import { cn } from "@/lib/utils"
import { Spinner } from "@/components/ui/spinner"

/**
 * Click-to-browse and drag-to-drop, shared by the new-chat screen and the
 * attach dialog so both accept the same formats and read the same way.
 *
 * Drop handling lives here rather than on the page, so dropping onto the zone
 * works even when the surrounding surface is a modal.
 */
function DocumentDropzone({
  onFiles,
  busy,
  className,
}: {
  onFiles: (files: File[]) => void
  /** Progress line while a file is being read; null when idle. */
  busy?: string | null
  className?: string
}) {
  const [isDragging, setIsDragging] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const isBusy = Boolean(busy)

  return (
    <>
      <button
        type="button"
        disabled={isBusy}
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault()
          if (!isBusy) setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault()
          setIsDragging(false)
          if (!isBusy) onFiles(Array.from(event.dataTransfer.files))
        }}
        className={cn(
          "flex w-full cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed bg-surface px-6 py-10 text-center transition-colors hover:border-brand disabled:cursor-not-allowed disabled:opacity-70",
          isDragging && "border-brand bg-accent/40",
          className
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
        ref={inputRef}
        type="file"
        multiple
        accept={DOCUMENT_ACCEPT}
        className="sr-only"
        onChange={(event) => {
          const files = Array.from(event.target.files ?? [])
          // Reset so re-picking the same file still fires `change`.
          event.target.value = ""
          onFiles(files)
        }}
      />
    </>
  )
}

export { DocumentDropzone }

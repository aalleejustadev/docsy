"use client"

import { ChevronDownIcon, LayersIcon } from "lucide-react"

import type { ChatDocumentView } from "@/lib/chat"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { InputGroupButton } from "@/components/ui/input-group"

/** "All 3 documents", "2 of 3 documents", or the name when it's just one. */
function scopeLabel(documents: ChatDocumentView[], selected: string[]) {
  if (selected.length === documents.length) {
    return `All ${documents.length} ${documents.length === 1 ? "document" : "documents"}`
  }

  if (selected.length === 1) {
    const only = documents.find((document) => document.id === selected[0])
    return only?.name ?? "1 document"
  }

  return `${selected.length} of ${documents.length} documents`
}

/**
 * Chooses which of a chat's documents the next question is answered from —
 * the chip beside the composer's send button.
 *
 * With one document there is nothing to choose, so it renders as a plain
 * label rather than a dropdown that only ever has one answer.
 */
function DocumentScope({
  documents,
  selected,
  onChange,
  disabled = false,
}: {
  documents: ChatDocumentView[]
  /** Ids the next question will be answered from. Never empty. */
  selected: string[]
  onChange: (selected: string[]) => void
  disabled?: boolean
}) {
  if (documents.length <= 1) {
    return (
      <span className="flex items-center gap-1.5 rounded-lg border bg-surface px-2 py-1 text-xs text-muted-foreground">
        <LayersIcon className="size-3.5" />
        {documents.length === 1 ? "1 document" : "No documents"}
      </span>
    )
  }

  function toggle(id: string) {
    if (selected.includes(id)) {
      // Something has to stay selected — an empty scope leaves Claude nothing
      // to answer from, so the last one can't be turned off.
      if (selected.length === 1) return

      onChange(selected.filter((selectedId) => selectedId !== id))
      return
    }

    // Kept in the chat's own order so the scope reads the same as the sources.
    onChange(
      documents
        .map((document) => document.id)
        .filter((id2) => selected.includes(id2) || id2 === id)
    )
  }

  const isEverything = selected.length === documents.length

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <InputGroupButton
            variant="outline"
            className="cursor-pointer"
            disabled={disabled}
            aria-label="Choose which documents to search"
          />
        }
      >
        <LayersIcon />
        <span className="max-w-40 truncate">
          {scopeLabel(documents, selected)}
        </span>
        <ChevronDownIcon />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-72">
        <DropdownMenuGroup>
          {/* Inside the group, not above it: `DropdownMenuLabel` renders Base
              UI's `Menu.GroupLabel`, which throws outright when it can't find
              a surrounding group. */}
          <DropdownMenuLabel>Answer from</DropdownMenuLabel>

          {documents.map((document) => {
            const isChecked = selected.includes(document.id)

            return (
              <DropdownMenuCheckboxItem
                key={document.id}
                checked={isChecked}
                // Base UI closes the menu on select by default; keeping it open
                // lets several documents be toggled in one go.
                closeOnClick={false}
                disabled={isChecked && selected.length === 1}
                onCheckedChange={() => toggle(document.id)}
                className="cursor-pointer"
              >
                <span className="truncate">{document.name}</span>
              </DropdownMenuCheckboxItem>
            )
          })}
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuItem
            disabled={isEverything}
            onClick={() => onChange(documents.map((document) => document.id))}
            className="cursor-pointer"
          >
            Select all documents
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export { DocumentScope }

"use client"

import * as React from "react"
import { FileTextIcon } from "lucide-react"

import { libraryDocuments, type LibraryDocument } from "@/lib/library"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command"
import { Kbd } from "@/components/ui/kbd"

/**
 * Picks documents already in the library into a chat —
 * `ui-design/dashboard/light/choose-from-library-modal.png`.
 *
 * A command palette rather than a list, so the search field filters as you
 * type. Rows toggle on click; the checkbox is presentational, which keeps a
 * click on it from toggling twice.
 */
function LibraryPickerDialog({
  open,
  onOpenChange,
  onAdd,
  addedIds,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdd: (documents: LibraryDocument[]) => void
  /** Already in this chat — shown checked-off rather than offered again. */
  addedIds: string[]
}) {
  const [selected, setSelected] = React.useState<string[]>([])

  function close() {
    setSelected([])
    onOpenChange(false)
  }

  function toggle(id: string) {
    setSelected((current) =>
      current.includes(id)
        ? current.filter((selectedId) => selectedId !== id)
        : [...current, id]
    )
  }

  function add() {
    onAdd(libraryDocuments.filter((document) => selected.includes(document.id)))
    close()
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={(next) => (next ? onOpenChange(true) : close())}
      title="Choose from Library"
      description="Search your library and add documents to this chat."
      // `CommandDialog` sits at a third of the viewport; the reference sits
      // higher, so the list has room to grow downward as you scroll it.
      className="top-28 sm:max-w-xl"
    >
      {/* The packaged input is a boxed field; the reference is a plain row with
          a rule under it, so the wrapper and its group are flattened here. */}
      <Command className="gap-0 p-0 [&_[data-slot=command-input-wrapper]]:border-b [&_[data-slot=command-input-wrapper]]:p-0 [&_[data-slot=input-group]]:h-14! [&_[data-slot=input-group]]:rounded-none! [&_[data-slot=input-group]]:border-0 [&_[data-slot=input-group]]:bg-transparent [&_[data-slot=input-group]]:px-3">
        <div className="relative">
          <CommandInput placeholder="Search your library…" />
          <Kbd className="absolute top-1/2 right-4 -translate-y-1/2 border bg-background">
            esc
          </Kbd>
        </div>

        <CommandList className="max-h-96">
          <CommandEmpty>No documents match that search.</CommandEmpty>

          <CommandGroup
            heading={`Library · ${libraryDocuments.length} documents`}
            className="p-0 **:[[cmdk-group-heading]]:px-4 **:[[cmdk-group-heading]]:pt-4 **:[[cmdk-group-heading]]:pb-2 **:[[cmdk-group-heading]]:text-[0.6875rem] **:[[cmdk-group-heading]]:font-bold **:[[cmdk-group-heading]]:tracking-[0.08em] **:[[cmdk-group-heading]]:uppercase"
          >
            {libraryDocuments.map((document) => {
              const added = addedIds.includes(document.id)
              const status = document.indexing
                ? "indexing…"
                : added
                  ? "added"
                  : null

              return (
                <CommandItem
                  key={document.id}
                  value={`${document.name} ${document.format}`}
                  disabled={document.indexing || added}
                  onSelect={() => toggle(document.id)}
                  className="cursor-pointer gap-3 rounded-none! px-4 py-3"
                >
                  <Checkbox
                    checked={added || selected.includes(document.id)}
                    className="pointer-events-none"
                  />

                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border bg-surface text-muted-foreground">
                    <FileTextIcon />
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">
                      {document.name}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {document.meta}
                    </span>
                  </span>

                  <CommandShortcut className="flex items-center gap-2 tracking-normal">
                    <Badge
                      variant="outline"
                      className="rounded-md font-mono text-[0.625rem] tracking-wider"
                    >
                      {document.format}
                    </Badge>
                    {status && <span className="text-xs">{status}</span>}
                  </CommandShortcut>
                </CommandItem>
              )
            })}
          </CommandGroup>
        </CommandList>

        <div className="flex items-center gap-3 border-t px-4 py-3">
          <span className="font-mono text-sm text-muted-foreground">
            {selected.length} selected
          </span>

          <Button
            variant="outline"
            size="lg"
            className="ml-auto cursor-pointer"
            onClick={close}
          >
            Cancel
          </Button>

          <Button
            size="lg"
            className="cursor-pointer"
            disabled={selected.length === 0}
            onClick={add}
          >
            Add {selected.length} {selected.length === 1 ? "source" : "sources"}
          </Button>
        </div>
      </Command>
    </CommandDialog>
  )
}

export { LibraryPickerDialog }

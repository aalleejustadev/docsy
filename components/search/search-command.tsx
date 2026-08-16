"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  FileTextIcon,
  MessageSquareIcon,
  PlusIcon,
  SearchIcon,
} from "lucide-react"

import {
  chatQuestionHref,
  chatRoute,
  CHATS_ROUTE,
  type ChatSummary,
  type LibraryDocumentView,
} from "@/lib/chat"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
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

type SearchData = {
  chats: ChatSummary[]
  documents: LibraryDocumentView[]
}

const STATUS_LABEL: Record<LibraryDocumentView["status"], string> = {
  READY: "indexed",
  PROCESSING: "indexing…",
  FAILED: "unreadable",
}

const groupHeading =
  "p-0 **:[[cmdk-group-heading]]:px-4 **:[[cmdk-group-heading]]:pt-4 **:[[cmdk-group-heading]]:pb-2 **:[[cmdk-group-heading]]:text-[0.6875rem] **:[[cmdk-group-heading]]:font-bold **:[[cmdk-group-heading]]:tracking-[0.08em] **:[[cmdk-group-heading]]:uppercase"

const row = "cursor-pointer gap-3 rounded-none! px-4 py-3"

/**
 * The dashboard's search — `ui-design/landing/light/14-command.png`.
 *
 * Trigger and palette in one component so ⌘K and the header button open the
 * same thing. Data is fetched when it opens rather than with the page, so it
 * reflects chats and uploads made since.
 */
function SearchCommand({ className }: { className?: string }) {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const [data, setData] = React.useState<SearchData>({
    chats: [],
    documents: [],
  })

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "k" || !(event.metaKey || event.ctrlKey)) return

      // Otherwise the browser's own find-in-page or search bar takes it.
      event.preventDefault()
      setOpen((current) => !current)
    }

    document.addEventListener("keydown", onKeyDown)

    return () => document.removeEventListener("keydown", onKeyDown)
  }, [])

  React.useEffect(() => {
    if (!open) return

    let cancelled = false

    void (async () => {
      const response = await fetch("/api/search")
      if (!response.ok || cancelled) return

      setData((await response.json()) as SearchData)
    })()

    return () => {
      cancelled = true
    }
  }, [open])

  function go(href: string) {
    setOpen(false)
    setQuery("")
    router.push(href)
  }

  // Asking needs somewhere to ask. The newest chat already has its documents
  // loaded, so a question typed here lands there with the composer filled in
  // rather than sent — the developer still gets to look before it runs.
  const newestChat = data.chats[0]
  const trimmedQuery = query.trim()

  return (
    <>
      <Button
        variant="outline"
        size="lg"
        onClick={() => setOpen(true)}
        className={cn(
          "w-64 cursor-pointer justify-start gap-2.5 pr-1.5 pl-2.5 font-normal",
          className
        )}
      >
        <SearchIcon className="text-muted-foreground" />
        <span className="text-muted-foreground">Search or ask…</span>
        <Kbd className="ml-auto">⌘K</Kbd>
      </Button>

      <CommandDialog
        open={open}
        onOpenChange={(next) => {
          if (!next) setQuery("")
          setOpen(next)
        }}
        title="Search"
        description="Search your chats and documents, or ask a question."
        className="top-28 sm:max-w-xl"
      >
        {/* The packaged input is a boxed field; the reference is a plain row
            with a rule under it, so the wrapper and its group are flattened. */}
        <Command
          shouldFilter
          className="gap-0 p-0 [&_[data-slot=command-input-wrapper]]:border-b [&_[data-slot=command-input-wrapper]]:p-0 [&_[data-slot=input-group]]:h-14! [&_[data-slot=input-group]]:rounded-none! [&_[data-slot=input-group]]:border-0 [&_[data-slot=input-group]]:bg-transparent [&_[data-slot=input-group]]:px-3"
        >
          <div className="relative">
            <CommandInput
              value={query}
              onValueChange={setQuery}
              placeholder="Search or ask across your documents…"
            />
            <Kbd className="absolute top-1/2 right-4 -translate-y-1/2 border bg-background">
              esc
            </Kbd>
          </div>

          <CommandList className="max-h-96">
            <CommandEmpty>Nothing matches that.</CommandEmpty>

            {trimmedQuery && newestChat && (
              <CommandGroup heading="Ask Docsy" className={groupHeading}>
                <CommandItem
                  // Forced to stay visible: cmdk would filter this row out on
                  // any query that doesn't happen to match its own text.
                  value={`ask ${trimmedQuery}`}
                  // Prefills the composer rather than asking outright — the
                  // palette is a jump, and half a thought typed into it
                  // shouldn't cost a question.
                  onSelect={() =>
                    go(chatQuestionHref(newestChat.id, trimmedQuery))
                  }
                  className={row}
                >
                  <MessageSquareIcon className="text-brand" />
                  <span className="min-w-0 flex-1 truncate">
                    {trimmedQuery}
                  </span>
                  <CommandShortcut className="tracking-normal">
                    in {newestChat.title}
                  </CommandShortcut>
                </CommandItem>
              </CommandGroup>
            )}

            {data.chats.length > 0 && (
              <CommandGroup heading="Chats" className={groupHeading}>
                {data.chats.map((chat) => (
                  <CommandItem
                    key={chat.id}
                    value={`chat ${chat.title}`}
                    onSelect={() => go(chatRoute(chat.id))}
                    className={row}
                  >
                    <MessageSquareIcon className="text-muted-foreground" />
                    <span className="min-w-0 flex-1 truncate">
                      {chat.title}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {data.documents.length > 0 && (
              <CommandGroup heading="Jump to" className={groupHeading}>
                {data.documents.map((document) => (
                  <CommandItem
                    key={document.id}
                    value={`document ${document.name}`}
                    onSelect={() => go(`/api/documents/${document.id}`)}
                    className={row}
                  >
                    <FileTextIcon className="text-muted-foreground" />
                    <span className="min-w-0 flex-1 truncate">
                      {document.name}
                    </span>
                    <CommandShortcut className="tracking-normal">
                      {STATUS_LABEL[document.status]}
                    </CommandShortcut>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            <CommandGroup heading="Actions" className={groupHeading}>
              <CommandItem
                value="new chat start"
                onSelect={() => go(CHATS_ROUTE)}
                className={row}
              >
                <PlusIcon className="text-muted-foreground" />
                <span className="flex-1">Start a new chat</span>
              </CommandItem>
            </CommandGroup>
          </CommandList>

          <div className="flex items-center gap-4 border-t px-4 py-2.5 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span aria-hidden className="font-mono">
                ↑↓
              </span>
              navigate
            </span>
            <span className="flex items-center gap-1.5">
              <span aria-hidden className="font-mono">
                ↵
              </span>
              select
            </span>
            <span className="flex items-center gap-1.5">
              <span aria-hidden className="font-mono">
                esc
              </span>
              close
            </span>
          </div>
        </Command>
      </CommandDialog>
    </>
  )
}

export { SearchCommand }

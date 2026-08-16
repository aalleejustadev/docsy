"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  ExternalLinkIcon,
  MessageSquarePlusIcon,
  MoreVerticalIcon,
  Trash2Icon,
} from "lucide-react"

import { chatRoute } from "@/lib/chat"
import type { LibraryRowView } from "@/lib/library"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "@/components/ui/toast"

/** "N chats" / "1 chat", for the delete confirmation. */
function chatsLabel(count: number) {
  return `${count} chat${count === 1 ? "" : "s"}`
}

/**
 * The overflow menu at the end of a library row —
 * `ui-design/dashboard/light/user-three-dots-action.png`.
 *
 * The only per-row client code on the page. Everything above it stays a server
 * component, so the menu takes the row it acts on as a plain prop rather than
 * refetching it.
 */
function LibraryRowActions({ document }: { document: LibraryRowView }) {
  const router = useRouter()
  const [isConfirmingDelete, setIsConfirmingDelete] = React.useState(false)
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [isStartingChat, setIsStartingChat] = React.useState(false)

  async function startChat() {
    setIsStartingChat(true)

    try {
      const response = await fetch("/api/chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentIds: [document.id] }),
      })

      if (!response.ok) {
        const detail = await response.json().catch(() => null)

        toast.add({
          title: "Couldn't start that chat.",
          description: detail?.error ?? "Try again in a moment.",
        })
        return
      }

      const chat = (await response.json()) as { id: string }
      router.push(chatRoute(chat.id))
    } catch {
      toast.add({
        title: "Couldn't start that chat.",
        description: "Check your connection and try again.",
      })
    } finally {
      setIsStartingChat(false)
    }
  }

  async function confirmDelete() {
    setIsDeleting(true)

    try {
      const response = await fetch(`/api/documents/${document.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const detail = await response.json().catch(() => null)

        toast.add({
          title: "Couldn't delete that document.",
          description: detail?.error ?? "Try again in a moment.",
        })
        return
      }

      toast.add({
        title: `Deleted "${document.name}".`,
        description:
          document.chatCount > 0
            ? `Removed as a source from ${chatsLabel(document.chatCount)}.`
            : "Removed from your library.",
      })

      setIsConfirmingDelete(false)
      router.refresh()
    } catch {
      toast.add({
        title: "Couldn't delete that document.",
        description: "Check your connection and try again.",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              className="cursor-pointer text-muted-foreground"
              aria-label={`Actions for ${document.name}`}
            >
              <MoreVerticalIcon />
            </Button>
          }
        />

        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuItem
            className="cursor-pointer"
            render={
              <a
                href={`/api/documents/${document.id}`}
                target="_blank"
                rel="noreferrer noopener"
              />
            }
          >
            <ExternalLinkIcon />
            Open document
          </DropdownMenuItem>

          <DropdownMenuItem
            className="cursor-pointer"
            // Only an indexed document has text behind it for Claude to read.
            disabled={document.status !== "READY" || isStartingChat}
            onClick={startChat}
          >
            {isStartingChat ? <Spinner /> : <MessageSquarePlusIcon />}
            Start a chat
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            variant="destructive"
            className="cursor-pointer"
            onClick={() => setIsConfirmingDelete(true)}
          >
            <Trash2Icon />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog
        open={isConfirmingDelete}
        onOpenChange={(open) => {
          if (!open && !isDeleting) setIsConfirmingDelete(false)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this document?</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;{document.name}&rdquo; will be removed from your library
              and can&apos;t be recovered.
              {document.chatCount > 0
                ? ` ${chatsLabel(document.chatCount)} cite it — those answers stay, but the passages behind them will no longer open.`
                : " No chat is using it."}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              onClick={confirmDelete}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {isDeleting && <Spinner data-icon="inline-start" />}
              Delete document
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export { LibraryRowActions }

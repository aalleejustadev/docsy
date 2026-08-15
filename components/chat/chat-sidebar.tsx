"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  ChevronsUpDownIcon,
  CreditCardIcon,
  HouseIcon,
  PlusIcon,
  Trash2Icon,
  UserIcon,
} from "lucide-react"

import type { SessionUser } from "@/lib/auth-client"
import { chatRoute, CHATS_ROUTE, type ChatSummary } from "@/lib/chat"
import {
  APP_ROOT,
  BILLING_ROUTE,
  defaultPlanLabel,
  SETTINGS_ROUTE,
} from "@/lib/dashboard-nav"
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
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "@/components/ui/toast"
import { UserAvatar } from "@/components/auth/user-avatar"
import { DocsyLogo } from "@/components/brand/docsy-logo"
import { AccountMenu } from "@/components/dashboard/account-menu"

/** Links above "Sign out" in the footer menu. */
const accountMenuItems = [
  { href: SETTINGS_ROUTE, label: "Account", icon: UserIcon },
  { href: BILLING_ROUTE, label: "Billing", icon: CreditCardIcon },
]

/**
 * Chat chrome — `ui-design/dashboard/light/chat-sidebar.png`. The product nav
 * gives way to chat history here, so the only way back out is "Home".
 */
function ChatSidebar({
  user,
  chats,
}: {
  user: SessionUser
  /** This workspace's conversations, newest first. */
  chats: ChatSummary[]
}) {
  const pathname = usePathname()
  const router = useRouter()

  // One dialog for the whole list rather than one per row — the sidebar can
  // hold fifty chats, and only ever one is being deleted.
  const [pendingDelete, setPendingDelete] = React.useState<ChatSummary | null>(
    null
  )
  const [isDeleting, setIsDeleting] = React.useState(false)

  async function confirmDelete() {
    if (!pendingDelete) return

    setIsDeleting(true)

    try {
      const response = await fetch(`/api/chats/${pendingDelete.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const detail = await response.json().catch(() => null)
        toast.add({
          title: "Couldn't delete that chat.",
          description: detail?.error ?? "Try again in a moment.",
        })
        return
      }

      const { deletedDocuments, keptSharedDocuments } =
        (await response.json()) as {
          deletedDocuments: number
          keptSharedDocuments: number
        }

      toast.add({
        title: `Deleted "${pendingDelete.title}".`,
        description:
          keptSharedDocuments > 0
            ? `${deletedDocuments} document${deletedDocuments === 1 ? "" : "s"} removed. ${keptSharedDocuments} kept — still used by another chat.`
            : `${deletedDocuments} document${deletedDocuments === 1 ? "" : "s"} removed from your library.`,
      })

      // Leaving the reader open on a chat that no longer exists would 404 on
      // the next navigation, so step back to a new chat first.
      if (pathname === chatRoute(pendingDelete.id)) {
        router.push(CHATS_ROUTE)
      }

      setPendingDelete(null)
      router.refresh()
    } catch {
      toast.add({
        title: "Couldn't delete that chat.",
        description: "Check your connection and try again.",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Sidebar>
      <SidebarHeader className="gap-4 px-3 pt-4 pb-2">
        <Link href={APP_ROOT} aria-label="Docsy home" className="px-1">
          <DocsyLogo />
        </Link>

        <Button
          size="lg"
          className="w-full cursor-pointer"
          render={<Link href={CHATS_ROUTE} />}
          nativeButton={false}
        >
          <PlusIcon />
          New chat
        </Button>
      </SidebarHeader>

      <SidebarContent className="gap-1">
        <SidebarGroup className="px-3 py-0">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  render={<Link href={APP_ROOT} />}
                  className="h-9 gap-3 px-2.5 text-muted-foreground"
                >
                  <HouseIcon />
                  <span>Home</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="gap-1 px-3 py-0">
          <SidebarGroupLabel className="mt-3 px-2 text-[0.6875rem] font-bold tracking-[0.08em] text-muted-foreground uppercase">
            Recent chats
          </SidebarGroupLabel>

          <SidebarGroupContent>
            {chats.length === 0 ? (
              <p className="px-2.5 py-1.5 text-sm text-muted-foreground">
                Nothing yet. Add a document to start your first chat.
              </p>
            ) : (
              <SidebarMenu className="gap-1">
                {chats.map((chat) => {
                  const href = chatRoute(chat.id)

                  return (
                    <SidebarMenuItem key={chat.id}>
                      <SidebarMenuButton
                        render={<Link href={href} />}
                        isActive={pathname === href}
                        className="h-9 px-2.5 pr-8 text-muted-foreground data-active:font-semibold data-active:text-sidebar-accent-foreground"
                      >
                        <span>{chat.title}</span>
                      </SidebarMenuButton>

                      <SidebarMenuAction
                        showOnHover
                        aria-label={`Delete ${chat.title}`}
                        className="top-2.5 cursor-pointer hover:text-destructive"
                        onClick={() => setPendingDelete(chat)}
                      >
                        <Trash2Icon />
                      </SidebarMenuAction>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            )}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <AccountMenu
              user={user}
              items={accountMenuItems}
              side="top"
              align="start"
              className="w-(--sidebar-width)"
              render={
                <SidebarMenuButton
                  size="lg"
                  className="cursor-pointer gap-3"
                  aria-label="Account menu"
                />
              }
            >
              <UserAvatar user={user} className="size-9" />
              <div className="flex min-w-0 flex-1 flex-col text-left">
                <span className="truncate text-sm font-semibold">
                  {user.name || user.email}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {defaultPlanLabel}
                </span>
              </div>
              <ChevronsUpDownIcon className="text-muted-foreground" />
            </AccountMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open && !isDeleting) setPendingDelete(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this chat?</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;{pendingDelete?.title}&rdquo; and its answers will be
              deleted, along with the documents behind it. Any document another
              chat is still using stays in your library. This can&apos;t be
              undone.
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
              Delete chat
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Sidebar>
  )
}

export { ChatSidebar }

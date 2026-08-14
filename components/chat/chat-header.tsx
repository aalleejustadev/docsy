"use client"

import { LayersIcon, SettingsIcon } from "lucide-react"

import type { SessionUser } from "@/lib/auth-client"
import { SETTINGS_ROUTE } from "@/lib/dashboard-nav"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { UserAvatar } from "@/components/auth/user-avatar"
import { AccountMenu } from "@/components/dashboard/account-menu"
import { ModeToggle } from "@/components/theme/mode-toggle"

/** Links above "Sign out" in the header menu. */
const accountMenuItems = [
  { href: SETTINGS_ROUTE, label: "Manage account", icon: SettingsIcon },
]

/**
 * Chrome above a chat — `chat-main.png` for a new chat, `chat-page-chat.png`
 * for one with documents. Each page passes its own title, since that now comes
 * from the chat row rather than the path.
 */
function ChatHeader({
  user,
  title,
  documentCount,
}: {
  user: SessionUser
  title: string
  /** Omitted on a new chat, which has nothing attached yet. */
  documentCount?: number
}) {
  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b bg-background px-6">
      <SidebarTrigger className="-ml-2 cursor-pointer md:hidden" />

      <h1 className="truncate text-base font-semibold">{title}</h1>

      {documentCount ? (
        <Badge
          variant="secondary"
          className="shrink-0 gap-1.5 rounded-full text-muted-foreground"
        >
          <LayersIcon className="size-3.5" />
          {documentCount} {documentCount === 1 ? "doc" : "docs"}
        </Badge>
      ) : null}

      <div className="ml-auto flex items-center gap-2">
        <ModeToggle className="size-9" />

        <AccountMenu
          user={user}
          items={accountMenuItems}
          align="end"
          render={
            <Button
              variant="ghost"
              size="icon-lg"
              className="cursor-pointer rounded-full"
              aria-label="Account menu"
            />
          }
        >
          <UserAvatar user={user} className="size-9" />
        </AccountMenu>
      </div>
    </header>
  )
}

export { ChatHeader }

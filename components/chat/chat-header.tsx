"use client"

import { usePathname } from "next/navigation"
import { LayersIcon, SettingsIcon } from "lucide-react"

import type { SessionUser } from "@/lib/auth-client"
import { chatFromPathname } from "@/lib/chat"
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
 * for one with documents. The title comes from the path rather than a prop so
 * the layout can own the header without knowing which chat is open.
 */
function ChatHeader({ user }: { user: SessionUser }) {
  const pathname = usePathname()
  const chat = chatFromPathname(pathname)

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b bg-background px-6">
      <SidebarTrigger className="-ml-2 cursor-pointer md:hidden" />

      <h1 className="truncate text-base font-semibold">
        {chat?.title ?? "New chat"}
      </h1>

      {chat && (
        <Badge
          variant="secondary"
          className="shrink-0 gap-1.5 rounded-full text-muted-foreground"
        >
          <LayersIcon className="size-3.5" />
          {chat.documents} docs
        </Badge>
      )}

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

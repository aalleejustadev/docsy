"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  ChevronsUpDownIcon,
  CreditCardIcon,
  HouseIcon,
  PlusIcon,
  UserIcon,
} from "lucide-react"

import type { SessionUser } from "@/lib/auth-client"
import { chatRoute, CHATS_ROUTE, recentChats } from "@/lib/chat"
import {
  APP_ROOT,
  BILLING_ROUTE,
  defaultPlanLabel,
  SETTINGS_ROUTE,
} from "@/lib/dashboard-nav"
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
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
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
function ChatSidebar({ user }: { user: SessionUser }) {
  const pathname = usePathname()

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
            <SidebarMenu className="gap-1">
              {recentChats.map((chat) => {
                const href = chatRoute(chat.id)

                return (
                  <SidebarMenuItem key={chat.id}>
                    <SidebarMenuButton
                      render={<Link href={href} />}
                      isActive={pathname === href}
                      className="h-9 px-2.5 text-muted-foreground data-active:font-semibold data-active:text-sidebar-accent-foreground"
                    >
                      <span>{chat.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
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
    </Sidebar>
  )
}

export { ChatSidebar }

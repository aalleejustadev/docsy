"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  ChevronsUpDownIcon,
  CreditCardIcon,
  PlusIcon,
  UserIcon,
} from "lucide-react"

import type { SessionUser } from "@/lib/auth-client"
import {
  APP_ROOT,
  BILLING_ROUTE,
  dashboardNav,
  defaultPlanLabel,
  isDashboardNavItemActive,
  SETTINGS_ROUTE,
  workspaceInitials,
} from "@/lib/dashboard-nav"
import { Badge } from "@/components/ui/badge"
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
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
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

/** Product navigation — `ui-design/dashboard/light/dashboard-sidebar.png`. */
function DashboardSidebar({
  user,
  workspaceName,
}: {
  user: SessionUser
  /** The active organization's name, resolved by the workspace layout. */
  workspaceName: string
}) {
  const pathname = usePathname()

  return (
    <Sidebar>
      <SidebarHeader className="gap-4 px-3 pt-4 pb-2">
        <Link href={APP_ROOT} aria-label="Docsy home" className="px-1">
          <DocsyLogo />
        </Link>

        <Button size="lg" className="w-full cursor-pointer">
          <PlusIcon />
          New chat
        </Button>
      </SidebarHeader>

      <SidebarContent className="gap-1">
        <div className="flex items-center gap-3 px-5 py-3">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-md border text-[0.625rem] font-semibold tracking-wide">
            {workspaceInitials(workspaceName)}
          </span>
          <span className="truncate text-sm font-semibold">
            {workspaceName}
          </span>
        </div>

        {dashboardNav.map((group, index) => (
          <SidebarGroup key={group.title ?? index} className="gap-1 px-3 py-0">
            {group.title && (
              <SidebarGroupLabel className="mt-3 px-2 text-[0.6875rem] font-bold tracking-[0.08em] text-muted-foreground uppercase">
                {group.title}
              </SidebarGroupLabel>
            )}

            <SidebarGroupContent>
              <SidebarMenu className="gap-1">
                {group.items.map((item) => {
                  const isActive = isDashboardNavItemActive(item, pathname)

                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        render={<Link href={item.href} />}
                        isActive={isActive}
                        className="h-9 gap-3 px-2.5 text-muted-foreground data-active:text-sidebar-accent-foreground"
                      >
                        <item.icon />
                        <span>{item.label}</span>
                      </SidebarMenuButton>

                      {item.count && (
                        <SidebarMenuBadge className="top-2 right-2 text-muted-foreground">
                          {item.count}
                        </SidebarMenuBadge>
                      )}

                      {item.tag && (
                        <Badge className="pointer-events-none absolute top-2 right-2 bg-brand/15 text-[0.625rem] font-bold tracking-wider text-brand uppercase group-data-[collapsible=icon]:hidden">
                          {item.tag}
                        </Badge>
                      )}

                      {/* Sub-links only while you're in that section — the
                        sidebar reference shows none at rest. */}
                      {item.items && isActive && (
                        <SidebarMenuSub className="my-1 gap-0.5">
                          {item.items.map((subItem) => (
                            <SidebarMenuSubItem key={subItem.href}>
                              <SidebarMenuSubButton
                                render={<Link href={subItem.href} />}
                                isActive={pathname === subItem.href}
                                className="text-muted-foreground data-active:font-medium"
                              >
                                <span>{subItem.label}</span>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      )}
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
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

export { DashboardSidebar }

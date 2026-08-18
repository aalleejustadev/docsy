"use client"

import { usePathname } from "next/navigation"
import { SettingsIcon } from "lucide-react"

import { ADMIN_BADGE, isAdminRoute } from "@/lib/admin"
import type { SessionUser } from "@/lib/auth-client"
import { dashboardPageTitle, SETTINGS_ROUTE } from "@/lib/dashboard-nav"
import { SEARCH_ROUTE } from "@/lib/search"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { UserAvatar } from "@/components/auth/user-avatar"
import { AccountMenu } from "@/components/dashboard/account-menu"
import { SearchCommand } from "@/components/search/search-command"
import { ModeToggle } from "@/components/theme/mode-toggle"

/** Links above "Sign out" in the header menu. */
const accountMenuItems = [
  { href: SETTINGS_ROUTE, label: "Manage account", icon: SettingsIcon },
]

/** Chrome above the page — `ui-design/dashboard/light/dashboard-header.png`. */
function DashboardHeader({
  user,
  title,
  badge,
  showSearch = true,
  showSidebarTrigger = false,
}: {
  user: SessionUser
  /** Overrides the route's own title, e.g. "Welcome" during onboarding. */
  title?: string
  /**
   * Overrides the pill beside the title. Left alone, the console adds its own
   * "ADMIN ONLY" — the layout that renders this header is shared by every
   * workspace route and doesn't know which one it's wrapping, the same reason
   * the title is read off the pathname.
   */
  badge?: string
  showSearch?: boolean
  /**
   * Opt-in, because `SidebarTrigger` throws outside a `SidebarProvider` and
   * only `(workspace)` has one. Forgetting it costs a mobile toggle; assuming
   * it costs the whole page.
   */
  showSidebarTrigger?: boolean
}) {
  const pathname = usePathname()
  const pill = badge ?? (isAdminRoute(pathname) ? ADMIN_BADGE : undefined)

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b bg-background px-6">
      {showSidebarTrigger && (
        <SidebarTrigger className="-ml-2 cursor-pointer md:hidden" />
      )}

      <h1 className="truncate text-base font-semibold">
        {title ?? dashboardPageTitle(pathname)}
      </h1>

      {pill && (
        <Badge className="shrink-0 bg-brand/15 font-mono text-[0.625rem] font-bold tracking-wider text-brand uppercase">
          {pill}
        </Badge>
      )}

      <div className="ml-auto flex shrink-0 items-center gap-2">
        {/* The search page has a search box of its own, and the reference
            drops this one there rather than showing two.

            The trigger is a rigid `w-64` by design; on a tablet that plus a
            title and a badge is wider than the header, so it gives ground
            until there's room for its full width again. */}
        {showSearch && pathname !== SEARCH_ROUTE && (
          <SearchCommand className="hidden w-44 sm:inline-flex lg:w-64" />
        )}
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

export { DashboardHeader }

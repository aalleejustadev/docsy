"use client"

import { usePathname } from "next/navigation"
import { SettingsIcon } from "lucide-react"

import type { SessionUser } from "@/lib/auth-client"
import { dashboardPageTitle, SETTINGS_ROUTE } from "@/lib/dashboard-nav"
import { SEARCH_ROUTE } from "@/lib/search"
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
  showSearch = true,
  showSidebarTrigger = false,
}: {
  user: SessionUser
  /** Overrides the route's own title, e.g. "Welcome" during onboarding. */
  title?: string
  showSearch?: boolean
  /**
   * Opt-in, because `SidebarTrigger` throws outside a `SidebarProvider` and
   * only `(workspace)` has one. Forgetting it costs a mobile toggle; assuming
   * it costs the whole page.
   */
  showSidebarTrigger?: boolean
}) {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b bg-background px-6">
      {showSidebarTrigger && (
        <SidebarTrigger className="-ml-2 cursor-pointer md:hidden" />
      )}

      <h1 className="text-base font-semibold">
        {title ?? dashboardPageTitle(pathname)}
      </h1>

      <div className="ml-auto flex items-center gap-2">
        {/* The search page has a search box of its own, and the reference
            drops this one there rather than showing two. */}
        {showSearch && pathname !== SEARCH_ROUTE && (
          <SearchCommand className="hidden sm:inline-flex" />
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

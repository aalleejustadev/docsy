"use client"

import { usePathname } from "next/navigation"
import { SettingsIcon } from "lucide-react"

import type { SessionUser } from "@/lib/auth-client"
import { APP_ROOT, dashboardPageTitle } from "@/lib/dashboard-nav"
import { Button } from "@/components/ui/button"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { UserAvatar } from "@/components/auth/user-avatar"
import { AccountMenu } from "@/components/dashboard/account-menu"
import { SearchAskButton } from "@/components/search/search-ask-button"
import { ModeToggle } from "@/components/theme/mode-toggle"

/** Links above "Sign out" in the header menu. */
const accountMenuItems = [
  {
    href: `${APP_ROOT}/settings/account`,
    label: "Manage account",
    icon: SettingsIcon,
  },
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
        {showSearch && <SearchAskButton className="hidden sm:inline-flex" />}
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

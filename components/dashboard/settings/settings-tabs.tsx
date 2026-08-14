"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import {
  BILLING_ROUTE,
  DANGER_ZONE_ROUTE,
  SETTINGS_ROUTE,
} from "@/lib/dashboard-nav"
import { cn } from "@/lib/utils"

const SETTINGS_TABS = [
  // "Profile" in the reference; "Account" here, to match the sidebar entry and
  // the account menu that both point at it.
  { href: SETTINGS_ROUTE, label: "Account" },
  { href: BILLING_ROUTE, label: "Billing" },
  { href: DANGER_ZONE_ROUTE, label: "Danger zone" },
]

/**
 * Looks like a tab strip, behaves like navigation — each tab is its own route,
 * so a reload or a shared link lands on the same panel.
 *
 * Deliberately not `components/ui/tabs`: that primitive owns a `tablist` and
 * its panels, and swapping the panel for a page navigation would leave screen
 * readers waiting for a tabpanel that never arrives. The classes below are the
 * ones `TabsList`/`TabsTrigger` wear, so it stays visually identical.
 */
function SettingsTabs() {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Settings sections"
      className="inline-flex h-8 w-fit items-center justify-center rounded-lg bg-muted p-[3px] text-muted-foreground"
    >
      {SETTINGS_TABS.map((tab) => {
        const isActive = pathname === tab.href

        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "inline-flex h-[calc(100%-1px)] items-center justify-center rounded-md border border-transparent px-3.5 text-sm font-medium whitespace-nowrap text-foreground/60 transition-all hover:text-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
              isActive &&
                "bg-background text-foreground shadow-sm dark:border-input dark:bg-input/30"
            )}
          >
            {tab.label}
          </Link>
        )
      })}
    </nav>
  )
}

export { SettingsTabs }

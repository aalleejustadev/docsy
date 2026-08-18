"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { ADMIN_TABS } from "@/lib/admin"
import { cn } from "@/lib/utils"

/**
 * The console's sections — `ui-design/dashboard/light/admin-page.png`.
 *
 * Underlined rather than the pill strip Settings wears, and navigation rather
 * than a `tablist`, for the same reason: each section is its own route, so a
 * reload or a shared link lands on the same panel.
 *
 * Sections whose route doesn't exist yet render as plain text. The strip is
 * part of the design and shows the whole shape of the console, but a link into
 * a 404 isn't a preview of anything — see `ready` in `lib/admin.ts`.
 */
function AdminTabs() {
  const pathname = usePathname()
  const activeRef = React.useRef<HTMLAnchorElement>(null)

  // On a phone the strip scrolls, and the section you're actually on can start
  // off-screen — landing on Logs and seeing Overview underlined is worse than
  // no underline at all. `nearest` so it only moves when it has to, and never
  // scrolls the page itself.
  React.useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "nearest", inline: "nearest" })
  }, [pathname])

  return (
    <nav
      aria-label="Admin sections"
      // Five tabs don't fit a phone, and wrapping them onto two rows breaks the
      // underline that ties the strip together — so the strip scrolls sideways
      // instead, which is what stopped it forcing the whole page wider.
      className="flex scrollbar-none items-center gap-1 overflow-x-auto border-b"
    >
      {ADMIN_TABS.map((tab) => {
        const isActive = pathname === tab.href
        const className = cn(
          "-mb-px inline-flex items-center border-b-2 border-transparent px-3 pb-3 text-sm whitespace-nowrap transition-colors",
          isActive
            ? "border-foreground font-semibold text-foreground"
            : "text-muted-foreground"
        )

        if (!tab.ready) {
          return (
            <span
              key={tab.href}
              aria-disabled
              className={cn(className, "cursor-default")}
            >
              {tab.label}
            </span>
          )
        }

        return (
          <Link
            key={tab.href}
            ref={isActive ? activeRef : undefined}
            href={tab.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(className, "hover:text-foreground")}
          >
            {tab.label}
          </Link>
        )
      })}
    </nav>
  )
}

export { AdminTabs }

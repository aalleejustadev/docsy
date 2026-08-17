import {
  ChartLineIcon,
  HouseIcon,
  LibraryIcon,
  MessageSquareIcon,
  SearchIcon,
  SettingsIcon,
  ShieldIcon,
  type LucideIcon,
} from "lucide-react"

/** Everything signed-in lives under `/app`, so links are built from this root. */
export const APP_ROOT = "/app"

/** The one route inside `/app` a user without a workspace can reach. */
export const ONBOARDING_ROUTE = `${APP_ROOT}/onboarding`

/**
 * Settings is one screen with three tabs, but each tab is its own route — the
 * tab strip is navigation, so it survives a reload and can be linked to.
 */
export const SETTINGS_ROUTE = `${APP_ROOT}/settings`
export const BILLING_ROUTE = `${SETTINGS_ROUTE}/billing`
export const DANGER_ZONE_ROUTE = `${SETTINGS_ROUTE}/danger-zone`

export type DashboardNavSubItem = {
  href: string
  label: string
}

/** Which live workspace number sits on the right of a nav item. */
export type DashboardNavCount = "chats" | "documents"

/**
 * The numbers themselves. Lives here rather than beside the query so the
 * sidebar can type its prop without importing a module that pulls in Prisma.
 */
export type DashboardNavCounts = Record<DashboardNavCount, number>

export type DashboardNavItem = {
  href: string
  label: string
  icon: LucideIcon
  /** Right-aligned count, read from the database by the workspace layout. */
  count?: DashboardNavCount
  /** Right-aligned pill, e.g. the owner role on Admin. */
  tag?: string
  /** Nested links, revealed while the section is open. */
  items?: DashboardNavSubItem[]
}

export type DashboardNavGroup = {
  /** Rendered as a small uppercase label above the group; omit for the first. */
  title?: string
  items: DashboardNavItem[]
}

/** Sidebar navigation — `ui-design/dashboard/light/dashboard-sidebar.png`. */
export const dashboardNav: DashboardNavGroup[] = [
  {
    items: [
      { href: APP_ROOT, label: "Home", icon: HouseIcon },
      {
        href: `${APP_ROOT}/chats`,
        label: "Chats",
        icon: MessageSquareIcon,
        count: "chats",
      },
      {
        href: `${APP_ROOT}/library`,
        label: "Library",
        icon: LibraryIcon,
        count: "documents",
      },
      { href: `${APP_ROOT}/search`, label: "Search", icon: SearchIcon },
    ],
  },
  {
    title: "Manage",
    items: [
      { href: `${APP_ROOT}/usage`, label: "Usage", icon: ChartLineIcon },
      {
        href: SETTINGS_ROUTE,
        label: "Settings",
        icon: SettingsIcon,
        // "Danger zone" is a tab but not a nav entry — it isn't somewhere you
        // navigate to on purpose.
        items: [
          { href: SETTINGS_ROUTE, label: "Account" },
          { href: BILLING_ROUTE, label: "Billing" },
        ],
      },
      {
        href: `${APP_ROOT}/admin`,
        label: "Admin",
        icon: ShieldIcon,
        tag: "Owner",
      },
    ],
  },
]

const navItems = dashboardNav.flatMap((group) => group.items)

/** True for the item's own route and anything nested under it. */
export function isDashboardNavItemActive(
  item: DashboardNavItem,
  pathname: string
) {
  return item.href === APP_ROOT
    ? pathname === APP_ROOT
    : pathname === item.href || pathname.startsWith(`${item.href}/`)
}

/**
 * The header title for a route — the label of the deepest nav item that owns
 * it, so `/app/library/contracts` still reads "Library".
 */
export function dashboardPageTitle(pathname: string) {
  const match = [...navItems]
    .sort((a, b) => b.href.length - a.href.length)
    .find((item) => isDashboardNavItemActive(item, pathname))

  return match?.label ?? "Home"
}

/** "Meridian Capital" → "MC", for the square badge beside the name. */
export function workspaceInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("")
}

// The plan label under the user's name is no longer a constant — it's the
// workspace's entitlement. `planLabel` in `lib/billing.ts` formats it, and each
// sidebar takes it as a prop from its layout.

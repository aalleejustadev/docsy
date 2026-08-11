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

export type DashboardNavItem = {
  href: string
  label: string
  icon: LucideIcon
  /** Right-aligned count. Placeholder copy until the real numbers exist. */
  count?: string
  /** Right-aligned pill, e.g. the owner role on Admin. */
  tag?: string
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
        count: "12",
      },
      {
        href: `${APP_ROOT}/library`,
        label: "Library",
        icon: LibraryIcon,
        count: "42",
      },
      { href: `${APP_ROOT}/search`, label: "Search", icon: SearchIcon },
    ],
  },
  {
    title: "Manage",
    items: [
      { href: `${APP_ROOT}/usage`, label: "Usage", icon: ChartLineIcon },
      { href: `${APP_ROOT}/settings`, label: "Settings", icon: SettingsIcon },
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

/** Placeholder plan label under the user's name until billing lands. */
export const defaultPlanLabel = "Pro plan"

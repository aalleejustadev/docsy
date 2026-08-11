import { cookies } from "next/headers"

import { requireSession } from "@/lib/session"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar"

/** Written by `SidebarProvider`; read here so the first paint matches. */
const SIDEBAR_COOKIE_NAME = "sidebar_state"

/**
 * Chrome for the signed-in product: a full-height sidebar and a header over
 * the content pane. Everything below `/app` renders inside it.
 */
export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // The guard lives here rather than in each page, so a new route under /app
  // is protected the moment it exists.
  const session = await requireSession()
  const cookieStore = await cookies()

  return (
    <SidebarProvider
      defaultOpen={cookieStore.get(SIDEBAR_COOKIE_NAME)?.value !== "false"}
    >
      <DashboardSidebar user={session.user} />

      <SidebarInset className="min-w-0">
        <DashboardHeader user={session.user} />
        <div className="flex-1">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}

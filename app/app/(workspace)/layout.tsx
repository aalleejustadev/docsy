import { cookies } from "next/headers"

import { getNavCounts } from "@/lib/chat-store"
import { requireOrganization, requireSession } from "@/lib/session"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar"

/** Written by `SidebarProvider`; read here so the first paint matches. */
const SIDEBAR_COOKIE_NAME = "sidebar_state"

/**
 * Chrome for the product proper: a full-height sidebar and a header over the
 * content pane. Reaching it requires a workspace — without one you land on
 * `/app/onboarding` instead.
 */
export default async function WorkspaceLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const session = await requireSession()
  const organization = await requireOrganization()
  const [cookieStore, counts] = await Promise.all([
    cookies(),
    getNavCounts(organization.id),
  ])

  return (
    <SidebarProvider
      defaultOpen={cookieStore.get(SIDEBAR_COOKIE_NAME)?.value !== "false"}
    >
      <DashboardSidebar
        user={session.user}
        workspaceName={organization.name}
        counts={counts}
      />

      <SidebarInset className="min-w-0">
        <DashboardHeader user={session.user} showSidebarTrigger />
        <div className="flex-1">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}

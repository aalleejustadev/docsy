import { cookies } from "next/headers"

import { requireOrganization, requireSession } from "@/lib/session"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { ChatHeader } from "@/components/chat/chat-header"
import { ChatSidebar } from "@/components/chat/chat-sidebar"

/** Written by `SidebarProvider`; read here so the first paint matches. */
const SIDEBAR_COOKIE_NAME = "sidebar_state"

/**
 * Chat has its own chrome: the sidebar carries chat history instead of the
 * product nav, so it gets its own route group rather than living under
 * `(workspace)`. It still needs a workspace — `requireOrganization` bounces
 * anyone without one to onboarding.
 *
 * The inset is pinned to the viewport so the thread scrolls under a fixed
 * header and composer instead of growing the page.
 */
export default async function ChatLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const session = await requireSession()
  await requireOrganization()
  const cookieStore = await cookies()

  return (
    <SidebarProvider
      defaultOpen={cookieStore.get(SIDEBAR_COOKIE_NAME)?.value !== "false"}
    >
      <ChatSidebar user={session.user} />

      <SidebarInset className="h-svh min-w-0 overflow-hidden">
        <ChatHeader user={session.user} />
        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}

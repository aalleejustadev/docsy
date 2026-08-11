import type { Metadata } from "next"

import { requireSession } from "@/lib/session"
import { HomeQuickActions } from "@/components/dashboard/home/home-quick-actions"
import { HomeRecentChats } from "@/components/dashboard/home/home-recent-chats"
import { HomeRecentDocuments } from "@/components/dashboard/home/home-recent-documents"
import { HomeStats } from "@/components/dashboard/home/home-stats"

export const metadata: Metadata = {
  title: "Home",
}

function greeting(date = new Date()) {
  const hour = date.getHours()

  if (hour < 12) return "Good morning"
  if (hour < 18) return "Good afternoon"
  return "Good evening"
}

/** Dashboard home — `ui-design/dashboard/light/dashboard-home.png`. */
export default async function AppHomePage() {
  const session = await requireSession()
  const firstName = session.user.name?.trim().split(/\s+/)[0]

  return (
    <div className="mx-auto w-full max-w-272 px-6 py-10">
      <h2 className="font-heading text-3xl font-bold tracking-tight">
        {greeting()}
        {firstName ? `, ${firstName}` : ""}
      </h2>
      <p className="mt-2 text-muted-foreground">
        Ask a question, or pick up where you left off.
      </p>

      <div className="mt-8">
        <HomeQuickActions />
      </div>

      <div className="mt-6">
        <HomeStats />
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        <HomeRecentChats />
        <HomeRecentDocuments />
      </div>
    </div>
  )
}

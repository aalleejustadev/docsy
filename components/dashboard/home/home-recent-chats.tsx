import Link from "next/link"
import { MessageSquareIcon } from "lucide-react"

import { chatRoute, CHATS_ROUTE, recentChats } from "@/lib/chat"
import { HomeSection } from "@/components/dashboard/home/home-section"

/** Left column of the home page — `dashboard-home.png`. */
function HomeRecentChats() {
  return (
    <HomeSection
      title="Recent chats"
      action={{ href: CHATS_ROUTE, label: "View all" }}
    >
      {recentChats.slice(0, 3).map((chat) => (
        <Link
          key={chat.id}
          href={chatRoute(chat.id)}
          className="flex items-center gap-3 p-4 transition-colors hover:bg-accent/50"
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
            <MessageSquareIcon className="size-4" />
          </span>

          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold">
              {chat.title}
            </span>
            <span className="block truncate text-sm text-muted-foreground">
              {chat.reply}
            </span>
          </span>

          <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
            {chat.age}
          </span>
        </Link>
      ))}
    </HomeSection>
  )
}

export { HomeRecentChats }

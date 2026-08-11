import Link from "next/link"
import { MessageSquareIcon } from "lucide-react"

import { APP_ROOT } from "@/lib/dashboard-nav"
import { HomeSection } from "@/components/dashboard/home/home-section"

/** Design copy — real chats replace this once they're stored. */
const RECENT_CHATS = [
  {
    id: "termination-terms",
    title: "Termination terms across contracts",
    reply: "Either party may terminate with 60 days'…",
    age: "2h",
  },
  {
    id: "q3-revenue",
    title: "Q3 revenue with page references",
    reply: "Revenue rose 14% to $23.8M, per p.4…",
    age: "1d",
  },
  {
    id: "liability-caps",
    title: "Liability caps and indemnities",
    reply: "Liability is capped at fees paid in the prior…",
    age: "3d",
  },
]

/** Left column of the home page — `dashboard-home.png`. */
function HomeRecentChats() {
  return (
    <HomeSection
      title="Recent chats"
      action={{ href: `${APP_ROOT}/chats`, label: "View all" }}
    >
      {RECENT_CHATS.map((chat) => (
        <Link
          key={chat.id}
          href={`${APP_ROOT}/chats/${chat.id}`}
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

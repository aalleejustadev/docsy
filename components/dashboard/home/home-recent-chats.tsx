import Link from "next/link"
import { formatDistanceToNowStrict } from "date-fns"
import { MessageSquareIcon } from "lucide-react"

import { chatRoute, CHATS_ROUTE } from "@/lib/chat"
import { listChats } from "@/lib/chat-store"
import { requireOrganization } from "@/lib/session"
import { HomeSection } from "@/components/dashboard/home/home-section"

/** Left column of the home page — `dashboard-home.png`. */
async function HomeRecentChats() {
  const organization = await requireOrganization()
  const chats = (await listChats(organization.id)).slice(0, 3)

  return (
    <HomeSection
      title="Recent chats"
      action={{ href: CHATS_ROUTE, label: "View all" }}
    >
      {chats.length === 0 ? (
        <p className="p-4 text-sm text-muted-foreground">
          No chats yet. Add a document to start one.
        </p>
      ) : (
        chats.map((chat) => (
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
                {chat.preview ?? "Reading the document…"}
              </span>
            </span>

            <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
              {formatDistanceToNowStrict(new Date(chat.updatedAt))}
            </span>
          </Link>
        ))
      )}
    </HomeSection>
  )
}

export { HomeRecentChats }

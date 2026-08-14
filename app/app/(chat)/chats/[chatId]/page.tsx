import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { getChat } from "@/lib/chat-store"
import { requireOrganization, requireSession } from "@/lib/session"
import { ChatConversation } from "@/components/chat/chat-conversation"
import { ChatHeader } from "@/components/chat/chat-header"

type ChatPageProps = {
  params: Promise<{ chatId: string }>
}

export async function generateMetadata({
  params,
}: ChatPageProps): Promise<Metadata> {
  const { chatId } = await params
  const organization = await requireOrganization()
  const chat = await getChat(chatId, organization.id)

  return { title: chat?.title ?? "Chat" }
}

/** An open chat — `ui-design/dashboard/light/chat-page-chat.png`. */
export default async function ChatPage({ params }: ChatPageProps) {
  const { chatId } = await params
  const session = await requireSession()
  const organization = await requireOrganization()
  const chat = await getChat(chatId, organization.id)

  // `getChat` scopes by workspace, so someone else's chat id is a 404 here
  // rather than a leak.
  if (!chat) {
    notFound()
  }

  return (
    <>
      <ChatHeader
        user={session.user}
        title={chat.title}
        documentCount={chat.documentCount}
      />
      <ChatConversation chat={chat} />
    </>
  )
}

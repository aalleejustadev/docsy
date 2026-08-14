import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { findChat } from "@/lib/chat"
import { ChatConversation } from "@/components/chat/chat-conversation"

type ChatPageProps = {
  params: Promise<{ chatId: string }>
}

export async function generateMetadata({
  params,
}: ChatPageProps): Promise<Metadata> {
  const { chatId } = await params

  return { title: findChat(chatId)?.title ?? "Chat" }
}

/** An open chat — `ui-design/dashboard/light/chat-page-chat.png`. */
export default async function ChatPage({ params }: ChatPageProps) {
  const { chatId } = await params
  const chat = findChat(chatId)

  if (!chat) {
    notFound()
  }

  return <ChatConversation chat={chat} />
}

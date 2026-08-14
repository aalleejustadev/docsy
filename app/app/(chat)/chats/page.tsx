import type { Metadata } from "next"

import { NewChatPanel } from "@/components/chat/new-chat-panel"

export const metadata: Metadata = {
  title: "New chat",
}

/** A fresh chat — `ui-design/dashboard/light/chat-main.png`. */
export default function NewChatPage() {
  return <NewChatPanel />
}

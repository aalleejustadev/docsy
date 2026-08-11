import { requireSession } from "@/lib/session"

/**
 * The signed-in boundary. Chrome lives one level down — `(workspace)` gets the
 * sidebar, `onboarding` gets a bare header — because a user without a
 * workspace has nothing to navigate to yet.
 */
export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // Here rather than in each page, so a new route under /app is protected the
  // moment it exists. `proxy.ts` turns most signed-out traffic away first.
  await requireSession()

  return children
}

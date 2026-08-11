import { redirectIfOnboarded, requireSession } from "@/lib/session"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"

/**
 * Onboarding chrome — the header without the sidebar or search, since there is
 * no workspace to navigate or search yet.
 * `ui-design/dashboard/light/dashboard-organisation.png`.
 */
export default async function OnboardingLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const session = await requireSession()
  await redirectIfOnboarded()

  return (
    <div className="flex min-h-svh flex-col">
      <DashboardHeader user={session.user} title="Welcome" showSearch={false} />
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  )
}

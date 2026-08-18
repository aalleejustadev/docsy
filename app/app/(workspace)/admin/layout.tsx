import { requireAdmin } from "@/lib/session"
import { AdminTabs } from "@/components/admin/admin-tabs"

/**
 * The frame every console section shares — heading, blurb, tab strip. Each tab
 * is a route below this layout, so switching one only swaps the panel.
 *
 * Lives under `(workspace)`, so the console wears the same sidebar and header
 * as the rest of the product rather than a bare screen of its own — it's
 * another place you navigate to, not somewhere you leave the app for.
 *
 * This is also the console's guard. `(workspace)` only checks for a session and
 * an organization, and nothing above it knows about roles; `requireAdmin()`
 * here (and in every page below) is what makes `/app/admin` staff-only. It has
 * to be repeated per subtree because Next renders a layout and its page
 * concurrently — a redirect thrown here does not stop the page rendering.
 */
export default async function AdminConsoleLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  await requireAdmin()

  return (
    <div className="mx-auto w-full max-w-240 px-6 py-10">
      <h2 className="font-heading text-3xl font-bold tracking-tight">
        Admin console
      </h2>
      <p className="mt-2 text-muted-foreground">
        Control the app and every user account.
      </p>

      <div className="mt-8">
        <AdminTabs />
      </div>

      <div className="mt-6">{children}</div>
    </div>
  )
}

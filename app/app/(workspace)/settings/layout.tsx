import { SettingsTabs } from "@/components/dashboard/settings/settings-tabs"

/**
 * The frame every settings tab shares — heading, blurb, tab strip. Each tab is
 * a route below this layout, so switching one only swaps the panel.
 */
export default function SettingsLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="mx-auto w-full max-w-180 px-6 py-10">
      <h2 className="font-heading text-3xl font-bold tracking-tight">
        Settings
      </h2>
      <p className="mt-2 text-muted-foreground">
        Manage your profile, plan, and account.
      </p>

      <div className="mt-8">
        <SettingsTabs />
      </div>

      <div className="mt-6">{children}</div>
    </div>
  )
}

import { enabledSocialProviderIds } from "@/lib/auth-providers"
import { AuthDialogProvider } from "@/components/auth/auth-dialog-provider"
import { SiteFooter } from "@/components/layout/site-footer"
import { SiteHeader } from "@/components/layout/site-header"

export default function MarketingLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    // Wraps the header too, so its CTAs open the same dialogs the landing
    // sections do. Which social buttons render is decided here, on the server.
    <AuthDialogProvider socialProviders={enabledSocialProviderIds()}>
      <div className="flex min-h-svh flex-col">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </div>
    </AuthDialogProvider>
  )
}

import Link from "next/link"

import { enabledSocialProviderIds } from "@/lib/auth-providers"
import { AuthDialogProvider } from "@/components/auth/auth-dialog-provider"
import { DocsyLogo } from "@/components/brand/docsy-logo"

/**
 * Standalone chrome for the few auth screens that can't be a modal, because
 * an email link has to land somewhere. No header, no footer — just the card.
 *
 * The dialogs are mounted here too, so a screen that ends in "now sign in"
 * can raise the real sign-in form instead of bouncing to the landing page.
 */
export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <AuthDialogProvider socialProviders={enabledSocialProviderIds()}>
      <div className="flex min-h-svh flex-col items-center justify-center gap-8 px-6 py-16">
        <Link href="/" aria-label="Docsy home">
          <DocsyLogo />
        </Link>
        {children}
      </div>
    </AuthDialogProvider>
  )
}

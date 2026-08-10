import Link from "next/link"

import { DocsyLogo } from "@/components/brand/docsy-logo"

/**
 * Standalone chrome for the few auth screens that can't be a modal, because
 * an email link has to land somewhere. No header, no footer — just the card.
 */
export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-8 px-6 py-16">
      <Link href="/" aria-label="Docsy home">
        <DocsyLogo />
      </Link>
      {children}
    </div>
  )
}

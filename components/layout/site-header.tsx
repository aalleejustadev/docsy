import Link from "next/link"

import { mainNav } from "@/lib/site-config"
import { Button } from "@/components/ui/button"
import { DocsyLogo } from "@/components/brand/docsy-logo"
import { MobileNav } from "@/components/layout/mobile-nav"
import { SearchDocsButton } from "@/components/search/search-docs-button"
import { ModeToggle } from "@/components/theme/mode-toggle"

function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 supports-backdrop-filter:backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-8 px-6">
        <Link href="/" aria-label="Docsy home">
          <DocsyLogo />
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {mainNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-muted-foreground transition-colors hover:text-brand"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <SearchDocsButton className="hidden lg:inline-flex" />
          <ModeToggle />
          <Button
            variant="ghost"
            className="hidden md:inline-flex"
            render={<Link href="/sign-in" />}
            nativeButton={false}
          >
            Sign in
          </Button>
          <Button
            className="hidden md:inline-flex"
            render={<Link href="/sign-up" />}
            nativeButton={false}
          >
            Try Docsy free
          </Button>
          <MobileNav items={mainNav} className="md:hidden" />
        </div>
      </div>
    </header>
  )
}

export { SiteHeader }

import Link from "next/link"

import { footerNav, siteConfig } from "@/lib/site-config"
import { Separator } from "@/components/ui/separator"
import { DocsyLogo } from "@/components/brand/docsy-logo"

function SiteFooter() {
  return (
    <footer className="border-t">
      <div className="mx-auto w-full max-w-6xl px-6">
        <div className="flex flex-col gap-8 pt-14 pb-12">
          <div className="flex flex-col gap-4">
            <Link href="/" aria-label="Docsy home" className="w-fit">
              <DocsyLogo size="sm" />
            </Link>
            <p className="max-w-72 text-sm leading-relaxed text-muted-foreground">
              Chat with your documents — with a citation for every answer.
            </p>
          </div>

          <nav className="grid max-w-3xl grid-cols-2 gap-8 sm:grid-cols-4">
            {footerNav.map((group) => (
              <div key={group.title} className="flex flex-col gap-4">
                <h2 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                  {group.title}
                </h2>
                <ul className="flex flex-col gap-2.5">
                  {group.items.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className="text-sm transition-colors hover:text-brand"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <Separator />

        <div className="flex flex-col gap-2 py-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} {siteConfig.name}, Inc. All rights
            reserved.
          </p>
          <p className="font-mono text-xs text-muted-foreground">
            Built for people who have to be right.
          </p>
        </div>
      </div>
    </footer>
  )
}

export { SiteFooter }

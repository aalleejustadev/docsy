"use client"

import * as React from "react"
import Link from "next/link"
import { MenuIcon } from "lucide-react"

import type { NavItem } from "@/lib/site-config"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { DocsyLogo } from "@/components/brand/docsy-logo"
import { SearchDocsButton } from "@/components/search/search-docs-button"

function MobileNav({
  items,
  className,
}: {
  items: NavItem[]
  className?: string
}) {
  const [open, setOpen] = React.useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={<Button variant="ghost" size="icon" className={className} />}
      >
        <MenuIcon />
        <span className="sr-only">Open menu</span>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="data-[side=right]:w-full data-[side=right]:sm:max-w-none"
      >
        <SheetHeader>
          <SheetTitle>
            <DocsyLogo />
            <span className="sr-only">Docsy navigation</span>
          </SheetTitle>
        </SheetHeader>
        <div className="px-4">
          <SearchDocsButton
            className="w-full justify-start"
            showShortcut={false}
          />
        </div>
        <nav className="flex flex-col gap-1 px-4">
          {items.map((item) => (
            <SheetClose
              key={item.href}
              nativeButton={false}
              render={
                <Link
                  href={item.href}
                  className="rounded-lg px-2 py-2 text-base text-muted-foreground transition-colors hover:bg-muted hover:text-brand"
                />
              }
            >
              {item.label}
            </SheetClose>
          ))}
        </nav>
        <SheetFooter className="grid grid-cols-2">
          <Button
            variant="outline"
            render={<Link href="/sign-in" />}
            nativeButton={false}
          >
            Sign in
          </Button>
          <Button render={<Link href="/sign-up" />} nativeButton={false}>
            Try Docsy free
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

export { MobileNav }

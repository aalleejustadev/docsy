"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { LogOutIcon, type LucideIcon } from "lucide-react"

import { signOut, type SessionUser } from "@/lib/auth-client"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { UserAvatar } from "@/components/auth/user-avatar"

type AccountMenuItem = {
  href: string
  label: string
  icon: LucideIcon
}

/**
 * The signed-in account menu, shared by the sidebar footer and the header
 * avatar — `ui-design/dashboard/light/dashboard-account-menu.png` and
 * `…/dashboard-header-account-menu.png`. Only the trigger and the links above
 * "Sign out" differ between the two.
 */
function AccountMenu({
  user,
  items = [],
  render,
  children,
  className,
  ...contentProps
}: React.ComponentProps<typeof DropdownMenuContent> & {
  user: SessionUser
  items?: AccountMenuItem[]
  /** The trigger element — each surface brings its own shape. */
  render: React.ComponentProps<typeof DropdownMenuTrigger>["render"]
  /** Contents of that trigger. */
  children: React.ReactNode
}) {
  const router = useRouter()
  const [pending, setPending] = React.useState(false)

  async function handleSignOut() {
    setPending(true)
    await signOut()
    // Straight to the landing page, and `refresh` so the server sees the
    // cleared cookie rather than serving the signed-in tree from the cache.
    router.replace("/")
    router.refresh()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={render}>{children}</DropdownMenuTrigger>

      <DropdownMenuContent
        className={cn("w-64 p-1.5", className)}
        {...contentProps}
      >
        <div className="flex items-center gap-3 px-1.5 py-2">
          <UserAvatar user={user} className="size-9" />
          <div className="flex min-w-0 flex-col">
            {user.name && (
              <span className="truncate text-sm font-semibold">
                {user.name}
              </span>
            )}
            <span className="truncate text-sm text-muted-foreground">
              {user.email}
            </span>
          </div>
        </div>

        <DropdownMenuSeparator />

        {items.map((item) => (
          <DropdownMenuItem
            key={item.href}
            render={<Link href={item.href} />}
            className="cursor-pointer gap-2.5 px-1.5 py-2"
          >
            <item.icon />
            {item.label}
          </DropdownMenuItem>
        ))}

        {items.length > 0 && <DropdownMenuSeparator />}

        <DropdownMenuItem
          disabled={pending}
          onClick={handleSignOut}
          className="cursor-pointer gap-2.5 px-1.5 py-2"
        >
          <LogOutIcon />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export { AccountMenu, type AccountMenuItem }

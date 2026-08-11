"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { LogOutIcon } from "lucide-react"

import { signOut, type SessionUser } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { UserAvatar } from "@/components/auth/user-avatar"

/** Signed-in state for the header: who you are, and the way out. */
function UserMenu({ user }: { user: SessionUser }) {
  const router = useRouter()
  const [pending, setPending] = React.useState(false)

  async function handleSignOut() {
    setPending(true)
    await signOut()
    setPending(false)
    router.refresh()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            aria-label="Account menu"
          />
        }
      >
        <UserAvatar user={user} size="sm" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <div className="flex flex-col gap-0.5 px-1.5 py-1.5">
          {user.name && (
            <span className="truncate text-sm font-medium">{user.name}</span>
          )}
          <span className="truncate text-xs text-muted-foreground">
            {user.email}
          </span>
        </div>

        <DropdownMenuSeparator />

        <DropdownMenuItem disabled={pending} onClick={handleSignOut}>
          <LogOutIcon />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export { UserMenu }

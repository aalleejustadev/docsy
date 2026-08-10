"use client"

import { useSession } from "@/lib/auth-client"
import { Skeleton } from "@/components/ui/skeleton"
import { AuthDialogTrigger } from "@/components/auth/auth-dialog-trigger"
import { UserMenu } from "@/components/auth/user-menu"

/**
 * The header's right-hand pair: sign-in / sign-up triggers when signed out,
 * the account menu when signed in.
 *
 * Signed-out triggers hide below `md`, where `MobileNav` takes over; the
 * account menu stays at every width so signing out is always reachable.
 */
function AuthHeaderActions() {
  const { data: session, isPending } = useSession()

  if (isPending) {
    return <Skeleton className="hidden h-8 w-40 rounded-lg md:block" />
  }

  if (session) {
    return <UserMenu user={session.user} />
  }

  return (
    <div className="hidden items-center gap-2 md:flex">
      <AuthDialogTrigger mode="sign-in" variant="ghost">
        Sign in
      </AuthDialogTrigger>
      <AuthDialogTrigger mode="sign-up">Try Docsy free</AuthDialogTrigger>
    </div>
  )
}

export { AuthHeaderActions }

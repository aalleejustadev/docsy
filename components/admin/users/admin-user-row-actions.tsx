"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  ArrowUpIcon,
  CircleAlertIcon,
  MailIcon,
  MoreVerticalIcon,
  RotateCcwIcon,
} from "lucide-react"

import type { AdminUserRow } from "@/lib/admin"
import { authClient } from "@/lib/auth-client"
import { nextPlanUp, planName } from "@/lib/billing"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "@/components/ui/toast"

/**
 * The overflow menu at the end of a user row —
 * `ui-design/dashboard/light/user-three-dots-action.png`.
 *
 * The only client code in the table. Everything above it stays a server
 * component, so the menu takes the row it acts on as a plain prop rather than
 * refetching it.
 *
 * Both actions go through `authClient.admin.*` and the password-reset endpoint
 * rather than routes of our own: Better Auth already authorizes them against
 * the caller's role, so there's no second implementation of "is this an admin"
 * to keep in step with the first.
 */
function AdminUserRowActions({ user }: { user: AdminUserRow }) {
  const router = useRouter()
  const [isSendingReset, setIsSendingReset] = React.useState(false)
  const [isConfirming, setIsConfirming] = React.useState(false)
  const [isSaving, setIsSaving] = React.useState(false)

  const isDeactivated = user.status === "deactivated"
  const upgrade = nextPlanUp(user.planId)

  async function sendPasswordReset() {
    setIsSendingReset(true)

    try {
      const { error } = await authClient.requestPasswordReset({
        email: user.email,
        redirectTo: "/reset-password",
      })

      if (error) {
        toast.add({
          type: "error",
          title: "Couldn't send that reset.",
          description: error.message ?? "Try again in a moment.",
        })
        return
      }

      toast.add({
        type: "success",
        title: "Password reset sent.",
        description: `${user.email} can set a new password from the link.`,
      })
    } catch {
      toast.add({
        type: "error",
        title: "Couldn't send that reset.",
        description: "Check your connection and try again.",
      })
    } finally {
      setIsSendingReset(false)
    }
  }

  /**
   * Deactivating bans the account: Better Auth then refuses their sign-ins and
   * revokes the sessions they already have, which is the whole point — a
   * deactivation that leaves an open tab working isn't one.
   */
  async function toggleDeactivated() {
    setIsSaving(true)

    try {
      const { error } = isDeactivated
        ? await authClient.admin.unbanUser({ userId: user.id })
        : await authClient.admin.banUser({
            userId: user.id,
            banReason: "Deactivated from the admin console",
          })

      if (error) {
        toast.add({
          type: "error",
          title: isDeactivated
            ? "Couldn't reactivate that account."
            : "Couldn't deactivate that account.",
          description: error.message ?? "Try again in a moment.",
        })
        return
      }

      toast.add({
        type: "success",
        title: isDeactivated
          ? `${user.name || user.email} can sign in again.`
          : `${user.name || user.email} has been deactivated.`,
        description: isDeactivated
          ? "Their account is active from now on."
          : "They're signed out everywhere and can't sign back in.",
      })

      setIsConfirming(false)
      router.refresh()
    } catch {
      toast.add({
        type: "error",
        title: "Couldn't change that account.",
        description: "Check your connection and try again.",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              className="cursor-pointer text-muted-foreground"
              aria-label={`Actions for ${user.name || user.email}`}
            >
              <MoreVerticalIcon />
            </Button>
          }
        />

        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem
            className="cursor-pointer"
            disabled={isSendingReset}
            onClick={sendPasswordReset}
          >
            {isSendingReset ? <Spinner /> : <MailIcon />}
            Send password reset
          </DropdownMenuItem>

          {/* Reading, not doing: an admin can see what someone is paying for,
              but a plan is something the workspace buys — granting one here
              would hand out a paid plan nobody paid for. */}
          <DropdownMenuItem disabled className="opacity-100">
            <ArrowUpIcon />
            {upgrade ? `On ${planName(user.planId)} plan` : "On highest plan"}
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            variant={isDeactivated ? "default" : "destructive"}
            className="cursor-pointer"
            // An admin deactivating themselves would lock the console behind an
            // account that can no longer sign in.
            disabled={user.isAdmin}
            onClick={() => setIsConfirming(true)}
          >
            {isDeactivated ? <RotateCcwIcon /> : <CircleAlertIcon />}
            {isDeactivated ? "Reactivate user" : "Deactivate user"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog
        open={isConfirming}
        onOpenChange={(open) => {
          if (!open && !isSaving) setIsConfirming(false)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isDeactivated
                ? "Reactivate this account?"
                : "Deactivate this account?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isDeactivated
                ? `${user.name || user.email} will be able to sign in again. Their documents and chats were never touched.`
                : `${user.name || user.email} will be signed out everywhere and refused at sign-in. Nothing is deleted — their documents, chats and workspace stay exactly as they are, and you can reactivate them here.`}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSaving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isSaving}
              onClick={toggleDeactivated}
              className={
                isDeactivated
                  ? undefined
                  : "bg-destructive text-white hover:bg-destructive/90"
              }
            >
              {isSaving && <Spinner data-icon="inline-start" />}
              {isDeactivated ? "Reactivate user" : "Deactivate user"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export { AdminUserRowActions }

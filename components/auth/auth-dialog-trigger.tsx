"use client"

import { Button } from "@/components/ui/button"
import {
  useAuthDialog,
  type AuthMode,
} from "@/components/auth/auth-dialog-provider"

/**
 * Drop-in replacement for the `<Button render={<Link href="/sign-up" />}>`
 * CTAs — same styling hooks, but it raises the modal instead of navigating.
 */
function AuthDialogTrigger({
  mode,
  onClick,
  ...props
}: React.ComponentProps<typeof Button> & { mode: AuthMode }) {
  const { open } = useAuthDialog()

  return (
    <Button
      {...props}
      onClick={(event) => {
        onClick?.(event)
        if (!event.defaultPrevented) open(mode)
      }}
    />
  )
}

export { AuthDialogTrigger }

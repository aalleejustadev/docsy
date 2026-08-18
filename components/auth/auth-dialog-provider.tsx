"use client"

import * as React from "react"

import type { SocialProviderId } from "@/lib/auth-providers"
import { SignInDialog } from "@/components/auth/sign-in-dialog"
import { SignUpDialog } from "@/components/auth/sign-up-dialog"

export type AuthMode = "sign-in" | "sign-up"

type AuthDialogContextValue = {
  /** `null` when neither dialog is showing. */
  mode: AuthMode | null
  open: (mode: AuthMode) => void
  close: () => void
}

const AuthDialogContext = React.createContext<AuthDialogContextValue | null>(
  null
)

function useAuthDialog() {
  const context = React.useContext(AuthDialogContext)

  if (!context) {
    throw new Error("useAuthDialog must be used inside <AuthDialogProvider>")
  }

  return context
}

/**
 * Owns both auth dialogs so any button on the page can raise them, and so
 * switching between sign-in and sign-up is a state change rather than a
 * navigation.
 *
 * Mount it above everything that needs a trigger — the header lives in the
 * layout, so the layout is the right level, not the page.
 */
function AuthDialogProvider({
  socialProviders = [],
  allowSignUps = true,
  children,
}: {
  /**
   * Providers with credentials configured. Resolved on the server and passed
   * down, since the client bundle can't read the OAuth env vars.
   */
  socialProviders?: SocialProviderId[]
  /**
   * The admin console's "Allow new sign-ups" switch, read on the server. The
   * server refuses either way — this is so a closed door says so up front
   * instead of after someone has filled the form in.
   */
  allowSignUps?: boolean
  children: React.ReactNode
}) {
  const [mode, setMode] = React.useState<AuthMode | null>(null)

  const value = React.useMemo<AuthDialogContextValue>(
    () => ({
      mode,
      open: (next) => setMode(next),
      close: () => setMode(null),
    }),
    [mode]
  )

  return (
    <AuthDialogContext value={value}>
      {children}

      <SignInDialog
        open={mode === "sign-in"}
        onOpenChange={(open) => setMode(open ? "sign-in" : null)}
        onSwitchToSignUp={() => setMode("sign-up")}
        socialProviders={socialProviders}
      />
      <SignUpDialog
        open={mode === "sign-up"}
        onOpenChange={(open) => setMode(open ? "sign-up" : null)}
        onSwitchToSignIn={() => setMode("sign-in")}
        socialProviders={socialProviders}
        allowSignUps={allowSignUps}
      />
    </AuthDialogContext>
  )
}

export { AuthDialogProvider, useAuthDialog }

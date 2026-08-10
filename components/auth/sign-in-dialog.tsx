"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

import { requestPasswordReset, signIn } from "@/lib/auth-client"
import type { SocialProviderId } from "@/lib/auth-providers"
import {
  AuthDialogShell,
  AuthSwitchButton,
} from "@/components/auth/auth-dialog-shell"
import { authErrorMessage } from "@/components/auth/auth-errors"
import {
  AuthDivider,
  AuthField,
  AuthFormError,
  AuthSubmitButton,
} from "@/components/auth/auth-form-parts"
import { SocialAuthButtons } from "@/components/auth/social-auth-buttons"

/** The dialog doubles as the entry point for password recovery. */
type View = "credentials" | "forgot-password" | "reset-sent"

const COPY: Record<View, { title: string; description: string }> = {
  credentials: {
    title: "Sign in to Docsy",
    description: "Welcome back — continue to your workspace",
  },
  "forgot-password": {
    title: "Reset your password",
    description: "We'll email you a link to set a new one",
  },
  "reset-sent": {
    title: "Check your inbox",
    description: "If that email has an account, a reset link is on its way",
  },
}

/** Sign-in modal — `ui-design/landing/light/12-sign-in-modal.png`. */
function SignInDialog({
  open,
  onOpenChange,
  onSwitchToSignUp,
  socialProviders = [],
  callbackURL = "/",
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSwitchToSignUp: () => void
  /** Provider ids with credentials configured, resolved on the server. */
  socialProviders?: SocialProviderId[]
  /** Where social sign-in returns to. */
  callbackURL?: string
}) {
  const router = useRouter()
  const [view, setView] = React.useState<View>("credentials")
  const [pending, setPending] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  function handleOpenChange(next: boolean) {
    if (!next) {
      setError(null)
      // Reset after the close animation so the copy doesn't swap mid-fade.
      setTimeout(() => setView("credentials"), 150)
    }
    onOpenChange(next)
  }

  function goTo(next: View) {
    setError(null)
    setView(next)
  }

  async function handleSignIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const form = new FormData(event.currentTarget)
    setPending(true)
    setError(null)

    // No `callbackURL` here on purpose — passing one makes the client redirect
    // itself, and we want to close the dialog and refresh in place instead.
    const { error: signInError } = await signIn.email({
      email: String(form.get("email")),
      password: String(form.get("password")),
    })

    setPending(false)

    if (signInError) {
      setError(authErrorMessage(signInError, "Could not sign you in."))
      return
    }

    handleOpenChange(false)
    router.refresh()
  }

  async function handleForgotPassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const form = new FormData(event.currentTarget)
    setPending(true)
    setError(null)

    const { error: resetError } = await requestPasswordReset({
      email: String(form.get("email")),
      redirectTo: `${window.location.origin}/reset-password`,
    })

    setPending(false)

    if (resetError) {
      setError(authErrorMessage(resetError, "Could not send the reset link."))
      return
    }

    // Better Auth answers identically whether or not the address exists, so
    // this screen must not imply the account was found.
    setView("reset-sent")
  }

  const { title, description } = COPY[view]

  return (
    <AuthDialogShell
      open={open}
      onOpenChange={handleOpenChange}
      title={title}
      description={description}
      footer={
        view === "credentials" ? (
          <>
            Don&apos;t have an account?{" "}
            <AuthSwitchButton onClick={onSwitchToSignUp}>
              Sign up
            </AuthSwitchButton>
          </>
        ) : (
          <>
            Remembered it?{" "}
            <AuthSwitchButton onClick={() => goTo("credentials")}>
              Back to sign in
            </AuthSwitchButton>
          </>
        )
      }
    >
      {view === "credentials" && (
        <div className="flex flex-col gap-5">
          <SocialAuthButtons
            providers={socialProviders}
            callbackURL={callbackURL}
            disabled={pending}
            onError={(message) => setError(message || null)}
          />
          {socialProviders.length > 0 && <AuthDivider />}

          <form onSubmit={handleSignIn} className="flex flex-col gap-4">
            <AuthFormError>{error}</AuthFormError>

            <AuthField
              id="sign-in-email"
              name="email"
              type="email"
              label="Email address"
              placeholder="you@company.com"
              autoComplete="email"
              required
              disabled={pending}
            />
            <AuthField
              id="sign-in-password"
              name="password"
              type="password"
              label="Password"
              placeholder="Your password"
              autoComplete="current-password"
              required
              disabled={pending}
              action={
                <button
                  type="button"
                  onClick={() => goTo("forgot-password")}
                  className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                >
                  Forgot password?
                </button>
              }
            />

            <div className="mt-1">
              <AuthSubmitButton pending={pending}>Continue</AuthSubmitButton>
            </div>
          </form>
        </div>
      )}

      {view === "forgot-password" && (
        <form onSubmit={handleForgotPassword} className="flex flex-col gap-4">
          <AuthFormError>{error}</AuthFormError>

          <AuthField
            id="forgot-password-email"
            name="email"
            type="email"
            label="Email address"
            placeholder="you@company.com"
            autoComplete="email"
            required
            disabled={pending}
          />

          <div className="mt-1">
            <AuthSubmitButton pending={pending}>
              Send reset link
            </AuthSubmitButton>
          </div>
        </form>
      )}

      {view === "reset-sent" && (
        <p className="text-center text-sm leading-relaxed text-muted-foreground">
          Open the link within the hour to choose a new password. Nothing
          arrived? Check your spam folder, then try again.
        </p>
      )}
    </AuthDialogShell>
  )
}

export { SignInDialog }

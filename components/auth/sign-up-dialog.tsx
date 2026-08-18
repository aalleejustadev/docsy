"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { LockIcon } from "lucide-react"

import { signUp } from "@/lib/auth-client"
import type { SocialProviderId } from "@/lib/auth-providers"
import { APP_ROOT } from "@/lib/dashboard-nav"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
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

/** Registration modal — `ui-design/landing/light/13-sign-up-modal.png`. */
function SignUpDialog({
  open,
  onOpenChange,
  onSwitchToSignIn,
  socialProviders = [],
  allowSignUps = true,
  callbackURL = APP_ROOT,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSwitchToSignIn: () => void
  /** Provider ids with credentials configured, resolved on the server. */
  socialProviders?: SocialProviderId[]
  /** False while an admin has registration closed — see the Security tab. */
  allowSignUps?: boolean
  /** Where the confirmation link in the verification email lands. */
  callbackURL?: string
}) {
  const router = useRouter()
  const [pending, setPending] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  function handleOpenChange(next: boolean) {
    if (!next) setError(null)
    onOpenChange(next)
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const form = new FormData(event.currentTarget)
    setPending(true)
    setError(null)

    const { data, error: signUpError } = await signUp.email({
      name: String(form.get("name")),
      email: String(form.get("email")),
      password: String(form.get("password")),
      callbackURL,
    })

    setPending(false)

    if (signUpError) {
      setError(authErrorMessage(signUpError, "Could not create your account."))
      return
    }

    handleOpenChange(false)

    // A token means sign-up established a session, so go straight to the app.
    // Without one, verification is still pending — stay put and let server
    // components pick up whatever state we do have.
    if (data?.token) {
      router.push(APP_ROOT)
    } else {
      router.refresh()
    }
  }

  return (
    <AuthDialogShell
      open={open}
      onOpenChange={handleOpenChange}
      title="Create your account"
      description="to start chatting with your documents"
      footer={
        <>
          Already have an account?{" "}
          <AuthSwitchButton onClick={onSwitchToSignIn}>
            Sign in
          </AuthSwitchButton>
        </>
      }
    >
      {!allowSignUps ? (
        // The server refuses these anyway; showing the form first would only
        // collect a password on the way to being told no.
        <Alert>
          <LockIcon />
          <AlertTitle>New sign-ups are closed right now.</AlertTitle>
          <AlertDescription>
            Docsy isn&apos;t accepting new accounts at the moment. If you
            already have one, sign in instead.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="flex flex-col gap-5">
          <SocialAuthButtons
            providers={socialProviders}
            callbackURL={callbackURL}
            disabled={pending}
            onError={(message) => setError(message || null)}
          />
          {socialProviders.length > 0 && <AuthDivider />}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <AuthFormError>{error}</AuthFormError>

            <AuthField
              id="sign-up-name"
              name="name"
              label="Full name"
              placeholder="Ada Lovelace"
              autoComplete="name"
              required
              disabled={pending}
            />
            <AuthField
              id="sign-up-email"
              name="email"
              type="email"
              label="Email address"
              placeholder="you@company.com"
              autoComplete="email"
              required
              disabled={pending}
            />
            <AuthField
              id="sign-up-password"
              name="password"
              type="password"
              label="Password"
              placeholder="At least 8 characters"
              autoComplete="new-password"
              minLength={8}
              required
              disabled={pending}
            />

            <div className="mt-1">
              <AuthSubmitButton pending={pending}>
                Create account
              </AuthSubmitButton>
            </div>
          </form>
        </div>
      )}
    </AuthDialogShell>
  )
}

export { SignUpDialog }

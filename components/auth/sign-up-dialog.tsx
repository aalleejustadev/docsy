"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

import { signUp } from "@/lib/auth-client"
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

/** Registration modal — `ui-design/landing/light/13-sign-up-modal.png`. */
function SignUpDialog({
  open,
  onOpenChange,
  onSwitchToSignIn,
  socialProviders = [],
  callbackURL = "/",
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSwitchToSignIn: () => void
  /** Provider ids with credentials configured, resolved on the server. */
  socialProviders?: SocialProviderId[]
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

    const { error: signUpError } = await signUp.email({
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

    // Sign-up establishes the session, so refresh to let server components
    // pick it up rather than navigating away from the landing page.
    handleOpenChange(false)
    router.refresh()
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
    </AuthDialogShell>
  )
}

export { SignUpDialog }

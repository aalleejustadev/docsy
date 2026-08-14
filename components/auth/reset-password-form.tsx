"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { resetPassword, signOut } from "@/lib/auth-client"
import { AuthDialogTrigger } from "@/components/auth/auth-dialog-trigger"
import { authErrorMessage } from "@/components/auth/auth-errors"
import {
  AuthField,
  AuthFormError,
  AuthSubmitButton,
} from "@/components/auth/auth-form-parts"

function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter()
  const [pending, setPending] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [done, setDone] = React.useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const form = new FormData(event.currentTarget)
    const password = String(form.get("password"))

    if (password !== String(form.get("confirmPassword"))) {
      setError("Those passwords don't match.")
      return
    }

    setPending(true)
    setError(null)

    const { error: resetError } = await resetPassword({
      newPassword: password,
      token,
    })

    if (resetError) {
      setPending(false)
      setError(authErrorMessage(resetError, "Could not reset your password."))
      return
    }

    // The reset deletes every session row server-side, but this browser is
    // still holding its own cookie — and the session data cached inside it
    // answers "signed in" without ever consulting the database. Signing out
    // clears both cookies, which is what makes the promise below true here.
    await signOut()

    setPending(false)
    setDone(true)
    router.refresh()
  }

  if (done) {
    return (
      <div className="flex flex-col gap-5 text-center">
        <p className="text-sm leading-relaxed text-muted-foreground">
          Your password is updated and every session has been signed out — other
          devices within a few minutes. Sign in again with your new password.
        </p>
        <AuthDialogTrigger mode="sign-in" className="h-11 w-full">
          Sign in
        </AuthDialogTrigger>
        <Link
          href="/"
          className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          Back to Docsy
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <AuthFormError>{error}</AuthFormError>

      <AuthField
        id="reset-password"
        name="password"
        type="password"
        label="New password"
        placeholder="At least 8 characters"
        autoComplete="new-password"
        minLength={8}
        required
        disabled={pending}
      />
      <AuthField
        id="reset-password-confirm"
        name="confirmPassword"
        type="password"
        label="Confirm new password"
        placeholder="Repeat your new password"
        autoComplete="new-password"
        minLength={8}
        required
        disabled={pending}
      />

      <div className="mt-1">
        <AuthSubmitButton pending={pending}>Set new password</AuthSubmitButton>
      </div>
    </form>
  )
}

export { ResetPasswordForm }

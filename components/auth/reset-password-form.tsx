"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { resetPassword } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
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

    setPending(false)

    if (resetError) {
      setError(authErrorMessage(resetError, "Could not reset your password."))
      return
    }

    setDone(true)
  }

  if (done) {
    return (
      <div className="flex flex-col gap-5 text-center">
        <p className="text-sm leading-relaxed text-muted-foreground">
          Your password is updated and every other session has been signed out.
        </p>
        <Button
          className="h-11 w-full"
          render={<Link href="/" />}
          nativeButton={false}
          onClick={() => router.refresh()}
        >
          Back to Docsy
        </Button>
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

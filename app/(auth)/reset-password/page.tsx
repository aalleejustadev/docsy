import type { Metadata } from "next"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { ResetPasswordForm } from "@/components/auth/reset-password-form"

export const metadata: Metadata = {
  title: "Reset password",
}

/**
 * Where the emailed reset link lands. Better Auth validates the token first
 * and redirects here with either `?token=` or `?error=INVALID_TOKEN`.
 */
export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string }>
}) {
  const { token, error } = await searchParams
  const isValid = Boolean(token) && !error

  return (
    <div className="w-full max-w-100 rounded-xl bg-popover p-8 ring-1 ring-foreground/10">
      <div className="mb-6 flex flex-col gap-1.5 text-center">
        <h1 className="font-heading text-xl leading-tight font-bold">
          {isValid ? "Choose a new password" : "This link has expired"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {isValid
            ? "Pick something you haven't used elsewhere"
            : "Reset links are single-use and last one hour"}
        </p>
      </div>

      {isValid ? (
        <ResetPasswordForm token={token!} />
      ) : (
        <Button
          className="h-11 w-full"
          render={<Link href="/" />}
          nativeButton={false}
        >
          Request a new link
        </Button>
      )}
    </div>
  )
}

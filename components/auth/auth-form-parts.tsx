"use client"

import { ArrowRightIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"

/** The "OR" rule separating social sign-in from the credential form. */
function AuthDivider() {
  return (
    <div className="flex items-center gap-3">
      <span aria-hidden className="h-px flex-1 bg-border" />
      <span className="text-xs font-medium tracking-wide text-muted-foreground">
        OR
      </span>
      <span aria-hidden className="h-px flex-1 bg-border" />
    </div>
  )
}

/**
 * Label above a 44px input, with room for a trailing action on the label row
 * (used by "Forgot password?").
 */
function AuthField({
  id,
  label,
  action,
  ...props
}: React.ComponentProps<typeof Input> & {
  id: string
  label: string
  action?: React.ReactNode
}) {
  return (
    <Field>
      <div className="flex items-center justify-between gap-3">
        <FieldLabel htmlFor={id}>{label}</FieldLabel>
        {action}
      </div>
      <Input id={id} className="h-11" {...props} />
    </Field>
  )
}

function AuthFormError({ children }: { children?: string | null }) {
  if (!children) return null

  return (
    <p
      role="alert"
      className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
    >
      {children}
    </p>
  )
}

function AuthSubmitButton({
  pending,
  children,
}: {
  pending: boolean
  children: React.ReactNode
}) {
  return (
    <Button
      type="submit"
      disabled={pending}
      className="h-11 w-full gap-2 text-sm font-medium"
    >
      {children}
      {pending ? <Spinner /> : <ArrowRightIcon />}
    </Button>
  )
}

export { AuthDivider, AuthField, AuthFormError, AuthSubmitButton }

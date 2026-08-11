"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ArrowRightIcon } from "lucide-react"

import { organization } from "@/lib/auth-client"
import { APP_ROOT } from "@/lib/dashboard-nav"
import { organizationSlug, uniqueSlugSuffix } from "@/lib/organization"
import { Button } from "@/components/ui/button"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { authErrorMessage } from "@/components/auth/auth-errors"
import { DocsyMark } from "@/components/brand/docsy-logo"
import { OrganizationSetupLoading } from "@/components/onboarding/organization-setup-loading"

/** Slugs are unique, and two people may well name their workspace the same. */
const SLUG_TAKEN = new Set([
  "ORGANIZATION_ALREADY_EXISTS",
  "ORGANIZATION_SLUG_ALREADY_TAKEN",
])
const SLUG_ATTEMPTS = 3

/**
 * The first thing a new user sees — `ui-design/dashboard/light/
 * dashboard-organisation.png`. Creating the organization also makes it the
 * active one, which is what `/app` reads to fill the sidebar.
 */
function CreateOrganizationForm() {
  const router = useRouter()
  const [name, setName] = React.useState("")
  const [pending, setPending] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const workspace = name.trim()
    if (!workspace) return

    setPending(true)
    setError(null)

    const base = organizationSlug(workspace)

    for (let attempt = 0; attempt < SLUG_ATTEMPTS; attempt++) {
      const { error: createError } = await organization.create({
        name: workspace,
        slug: attempt === 0 ? base : `${base}-${uniqueSlugSuffix()}`,
      })

      if (!createError) {
        // Stay on the loading state through the navigation — the workspace is
        // ready, and flashing the empty form back would read as a failure.
        router.replace(APP_ROOT)
        router.refresh()
        return
      }

      if (!createError.code || !SLUG_TAKEN.has(createError.code)) {
        setPending(false)
        setError(
          authErrorMessage(createError, "Could not create your workspace.")
        )
        return
      }
    }

    setPending(false)
    setError("That name is taken. Try a different one.")
  }

  if (pending) {
    return <OrganizationSetupLoading name={name.trim()} />
  }

  return (
    <div className="mx-auto w-full max-w-md px-6 pt-24 pb-16">
      <DocsyMark className="size-12" />

      <h1 className="mt-6 font-heading text-3xl font-bold tracking-tight">
        Name your organization
      </h1>
      <p className="mt-3 leading-relaxed text-muted-foreground">
        This is your workspace for documents, chats, and teammates. You can
        change it later in Settings.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
        {error && (
          <p
            role="alert"
            className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {error}
          </p>
        )}

        <Field>
          <FieldLabel htmlFor="organization-name">Organization name</FieldLabel>
          <Input
            id="organization-name"
            name="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. Meridian Capital"
            autoComplete="organization"
            autoFocus
            required
            maxLength={64}
            className="h-11"
          />
        </Field>

        <Button
          type="submit"
          disabled={!name.trim()}
          className="h-11 w-full cursor-pointer gap-2 text-sm font-medium"
        >
          Continue
          <ArrowRightIcon />
        </Button>
      </form>
    </div>
  )
}

export { CreateOrganizationForm }

"use client"

import * as React from "react"

import { signIn } from "@/lib/auth-client"
import { SOCIAL_PROVIDERS, type SocialProviderId } from "@/lib/auth-providers"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { PROVIDER_ICONS } from "@/components/auth/provider-icons"

function SocialAuthButtons({
  providers,
  callbackURL,
  disabled,
  onError,
}: {
  providers: SocialProviderId[]
  callbackURL: string
  disabled?: boolean
  onError: (message: string) => void
}) {
  const [pending, setPending] = React.useState<SocialProviderId | null>(null)

  if (providers.length === 0) return null

  async function handleClick(provider: SocialProviderId) {
    setPending(provider)
    onError("")

    const { error } = await signIn.social({ provider, callbackURL })

    // On success the browser is already navigating to the provider, so the
    // spinner stays up; only a failure returns control to us.
    if (error) {
      setPending(null)
      onError(error.message ?? "Could not reach the provider. Try again.")
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {SOCIAL_PROVIDERS.filter((provider) =>
        providers.includes(provider.id)
      ).map((provider) => {
        const Icon = PROVIDER_ICONS[provider.id]

        return (
          <Button
            key={provider.id}
            type="button"
            variant="outline"
            className="h-11 w-full gap-2.5 text-sm font-medium"
            disabled={disabled || pending !== null}
            onClick={() => handleClick(provider.id)}
          >
            {pending === provider.id ? (
              <Spinner />
            ) : (
              <Icon className="size-4.5" />
            )}
            {provider.label}
          </Button>
        )
      })}
    </div>
  )
}

export { SocialAuthButtons }

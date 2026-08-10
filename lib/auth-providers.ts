/**
 * The social providers the sign-in / sign-up dialogs can offer.
 *
 * Each one is optional: a provider is only registered with Better Auth — and
 * only rendered in the UI — when both of its env vars are set. That keeps the
 * app bootable before you've created the OAuth apps.
 */

export type SocialProviderId = "google" | "github"

type SocialProvider = {
  id: SocialProviderId
  /** Button copy, straight from the design. */
  label: string
  clientIdEnv: string
  clientSecretEnv: string
}

export const SOCIAL_PROVIDERS: readonly SocialProvider[] = [
  {
    id: "google",
    label: "Continue with Google",
    clientIdEnv: "GOOGLE_CLIENT_ID",
    clientSecretEnv: "GOOGLE_CLIENT_SECRET",
  },
  {
    id: "github",
    label: "Continue with GitHub",
    clientIdEnv: "GITHUB_CLIENT_ID",
    clientSecretEnv: "GITHUB_CLIENT_SECRET",
  },
]

type Credentials = { clientId: string; clientSecret: string }

function readCredentials(provider: SocialProvider): Credentials | null {
  const clientId = process.env[provider.clientIdEnv]
  const clientSecret = process.env[provider.clientSecretEnv]

  return clientId && clientSecret ? { clientId, clientSecret } : null
}

/**
 * Server-only. Builds the `socialProviders` block for `betterAuth()`, omitting
 * any provider whose credentials are missing.
 */
export function configuredSocialProviders(): Partial<
  Record<SocialProviderId, Credentials>
> {
  const entries = SOCIAL_PROVIDERS.map(
    (provider) => [provider.id, readCredentials(provider)] as const
  ).filter(
    (entry): entry is [SocialProviderId, Credentials] => entry[1] !== null
  )

  return Object.fromEntries(entries)
}

/**
 * Server-only. The ids the UI should render buttons for. Pass the result down
 * to the client — the client bundle can't read these env vars itself.
 */
export function enabledSocialProviderIds(): SocialProviderId[] {
  return SOCIAL_PROVIDERS.filter((provider) => readCredentials(provider)).map(
    (provider) => provider.id
  )
}

/**
 * Slugs are required by Better Auth and unique across organizations, but the
 * onboarding form only asks for a name — so derive one from it.
 * "Meridian Capital" → "meridian-capital".
 */
export function organizationSlug(name: string) {
  const slug = name
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48)

  // Names written entirely in a non-latin script can slugify to nothing.
  return slug || "workspace"
}

/** A short suffix to retry with when the slug is already taken. */
export function uniqueSlugSuffix() {
  return Math.random().toString(36).slice(2, 6)
}

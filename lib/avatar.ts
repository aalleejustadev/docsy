/** Shared rules for profile pictures, used by the upload route and the form. */

/**
 * Only raster formats a browser renders inertly. SVG is deliberately absent —
 * it can carry script, and this app serves avatars from its own origin.
 */
export const AVATAR_MIME_TYPES = ["image/png", "image/jpeg", "image/webp"]

/** Post-downscale ceiling. The client resizes well under this. */
export const AVATAR_MAX_BYTES = 2 * 1024 * 1024

/** Longest edge after the client-side downscale. */
export const AVATAR_MAX_DIMENSION = 512

const SIGNATURES: { type: string; bytes: number[]; offset?: number }[] = [
  { type: "image/png", bytes: [0x89, 0x50, 0x4e, 0x47] },
  { type: "image/jpeg", bytes: [0xff, 0xd8, 0xff] },
  // "RIFF....WEBP" — the tag sits after the 4-byte length.
  { type: "image/webp", bytes: [0x57, 0x45, 0x42, 0x50], offset: 8 },
]

/**
 * The content type the *bytes* claim, not the one the upload claims. The
 * response echoes this back later, so trusting the client here would let
 * someone park arbitrary content on our origin under a type of their choosing.
 */
export function sniffImageType(bytes: Uint8Array) {
  const match = SIGNATURES.find(({ bytes: signature, offset = 0 }) =>
    signature.every((byte, index) => bytes[offset + index] === byte)
  )

  return match?.type ?? null
}

/**
 * Where a user's picture is served from. The version stamp busts both the
 * browser cache and any CDN when the picture changes — the bytes behind a
 * given URL never do.
 */
export function avatarUrl(userId: string, version: number | Date) {
  const stamp = version instanceof Date ? version.getTime() : version

  return `/api/avatar/${userId}?v=${stamp}`
}

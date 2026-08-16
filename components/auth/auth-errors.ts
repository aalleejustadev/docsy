type AuthError = {
  code?: string
  message?: string
  status?: number
} | null

/**
 * Better Auth returns stable error codes; these are the ones a user can
 * actually act on. Anything else falls through to the caller's fallback so we
 * never surface a raw server string.
 */
const MESSAGES: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD: "That email and password don't match an account.",
  USER_ALREADY_EXISTS: "An account with that email already exists.",
  EMAIL_NOT_VERIFIED:
    "Confirm your email address first — check your inbox for the link.",
  PASSWORD_TOO_SHORT: "Passwords need to be at least 8 characters.",
  PASSWORD_TOO_LONG: "That password is too long.",
  INVALID_TOKEN: "That link is invalid or has already been used.",
  INVALID_EMAIL: "Enter a valid email address.",
  INVALID_PASSWORD: "That password doesn't match this account.",
  // Deleting an account without a password to confirm it needs a session
  // minted in the last hour — signing in again is the way back.
  SESSION_EXPIRED: "Sign out and sign back in, then try that again.",
}

export function authErrorMessage(error: AuthError, fallback: string) {
  if (!error) return fallback

  if (error.status === 429) {
    return "Too many attempts. Wait a minute and try again."
  }

  if (error.code && MESSAGES[error.code]) {
    return MESSAGES[error.code]
  }

  return error.message || fallback
}

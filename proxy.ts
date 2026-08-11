import { NextResponse, type NextRequest } from "next/server"
import { getSessionCookie } from "better-auth/cookies"

/**
 * An optimistic gate in front of `/app`: it only looks for the session cookie,
 * so a signed-out visitor is bounced without a database round trip. The cookie
 * is not proof of a valid session — `app/app/layout.tsx` still verifies it.
 *
 * (Next 16 renamed Middleware to Proxy; same file convention, new name.)
 */
export function proxy(request: NextRequest) {
  if (getSessionCookie(request)) {
    return NextResponse.next()
  }

  const signedOut = new URL("/", request.url)

  return NextResponse.redirect(signedOut)
}

export const config = {
  matcher: ["/app/:path*"],
}

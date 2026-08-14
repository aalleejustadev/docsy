import { NextResponse } from "next/server"

import { db } from "@/lib/db"

/**
 * Serves a stored profile picture.
 *
 * Public on purpose — an avatar is shown next to a name wherever the user
 * appears, and gating it behind a session would break every such surface. The
 * id is the only thing exposed, and it's already in the URLs of anything that
 * renders the picture.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params

  const avatar = await db.avatar.findUnique({
    where: { userId },
    select: { contentType: true, data: true, updatedAt: true },
  })

  if (!avatar) {
    return new NextResponse(null, { status: 404 })
  }

  return new NextResponse(new Uint8Array(avatar.data), {
    headers: {
      "Content-Type": avatar.contentType,
      // The URL carries a version stamp, so a given URL's bytes never change.
      "Cache-Control": "public, max-age=31536000, immutable",
      // Belt and braces around user-supplied bytes on our own origin: never
      // let the browser second-guess the type, never render it as a document.
      "X-Content-Type-Options": "nosniff",
      "Content-Disposition": "inline",
      "Last-Modified": avatar.updatedAt.toUTCString(),
    },
  })
}

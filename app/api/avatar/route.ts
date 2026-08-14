import { headers } from "next/headers"
import { NextResponse } from "next/server"

import { auth } from "@/lib/auth"
import {
  AVATAR_MAX_BYTES,
  AVATAR_MIME_TYPES,
  avatarUrl,
  sniffImageType,
} from "@/lib/avatar"
import { db } from "@/lib/db"

/**
 * Stores a profile picture and points the user's `image` at it.
 *
 * The bytes live in Postgres rather than object storage — an avatar is a few
 * dozen KB after the client downscales it, and this keeps the app to one
 * backing service. Swap this handler for a blob upload if they ever get big.
 */
export async function POST(request: Request) {
  const requestHeaders = await headers()
  const session = await auth.api.getSession({ headers: requestHeaders })

  if (!session) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get("file")

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file received." }, { status: 400 })
  }

  if (file.size > AVATAR_MAX_BYTES) {
    return NextResponse.json(
      { error: "That image is over 2 MB." },
      { status: 413 }
    )
  }

  const bytes = new Uint8Array(await file.arrayBuffer())
  const contentType = sniffImageType(bytes)

  // Sniffed, not declared: the GET handler echoes this type back from our own
  // origin, so it has to describe what's actually in the row.
  if (!contentType || !AVATAR_MIME_TYPES.includes(contentType)) {
    return NextResponse.json(
      { error: "Use a PNG, JPEG, or WebP image." },
      { status: 415 }
    )
  }

  const userId = session.user.id
  const data = Buffer.from(bytes)

  const avatar = await db.avatar.upsert({
    where: { userId },
    create: { userId, contentType, data },
    update: { contentType, data },
  })

  const image = avatarUrl(userId, avatar.updatedAt)

  await auth.api.updateUser({ headers: requestHeaders, body: { image } })

  return NextResponse.json({ image })
}

/**
 * Drops the picture. `deleteMany` rather than `delete` because there may be no
 * row at all — a Google or GitHub avatar lives on the provider's CDN, and
 * removing it is only ever a matter of clearing `user.image`.
 */
export async function DELETE() {
  const requestHeaders = await headers()
  const session = await auth.api.getSession({ headers: requestHeaders })

  if (!session) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 })
  }

  await db.avatar.deleteMany({ where: { userId: session.user.id } })
  await auth.api.updateUser({ headers: requestHeaders, body: { image: null } })

  return NextResponse.json({ image: null })
}

import { NextResponse } from "next/server"

import { purgeExpiredChats } from "@/lib/app-settings-store"

/**
 * The scheduled half of data retention.
 *
 * The Security tab purges once when the window is changed, which covers the
 * chats that are already too old. Everything that ages past the window later
 * needs something to come back and look — that's this, and it's why the setting
 * is a policy rather than a one-off sweep.
 *
 * Point a scheduler at it (Vercel Cron, GitHub Actions, anything that can make
 * an authenticated request):
 *
 *   POST /api/cron/retention
 *   Authorization: Bearer $CRON_SECRET
 *
 * Without `CRON_SECRET` set the route refuses every call — an unauthenticated
 * endpoint that deletes chats is not something to leave running by default.
 */
export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET

  if (!secret) {
    return NextResponse.json(
      { error: "CRON_SECRET is not configured." },
      { status: 503 }
    )
  }

  const authorization = request.headers.get("authorization")

  if (authorization !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 })
  }

  try {
    const result = await purgeExpiredChats()

    return NextResponse.json({ ok: true, ...result })
  } catch (error) {
    console.error("[cron] retention purge failed", error)

    return NextResponse.json({ error: "Purge failed." }, { status: 500 })
  }
}

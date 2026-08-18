import { NextResponse } from "next/server"

import {
  describeRetentionChange,
  describeSettingChange,
  LOG_ACTIONS,
} from "@/lib/admin-log"
import { actorNameFor, recordAdminLog } from "@/lib/admin-log-store"
import { requireApiAdmin } from "@/lib/api-session"
import { retentionFromValue, type AppSettings } from "@/lib/app-settings"
import { purgeExpiredChats, updateAppSettings } from "@/lib/app-settings-store"

/**
 * The Security tab's writes.
 *
 * Takes a patch rather than the whole object: the page sends the one control
 * that moved, so two admins with the page open don't overwrite each other's
 * other switches with whatever their tab last rendered.
 */
export async function PATCH(request: Request) {
  const guard = await requireApiAdmin()
  if (!guard.ok) return guard.response

  const body = (await request.json().catch(() => null)) as {
    allowSignUps?: unknown
    enforceTwoFactor?: unknown
    maintenanceMode?: unknown
    /** The select's string — "12" or "never". */
    chatRetention?: unknown
  } | null

  if (!body) {
    return NextResponse.json({ error: "Nothing to save." }, { status: 400 })
  }

  const patch: Partial<AppSettings> = {}

  // Each field is only copied across when it's the right type, so a malformed
  // body can't blank a setting by sending it as null.
  if (typeof body.allowSignUps === "boolean") {
    patch.allowSignUps = body.allowSignUps
  }
  if (typeof body.maintenanceMode === "boolean") {
    patch.maintenanceMode = body.maintenanceMode
  }
  if (typeof body.enforceTwoFactor === "boolean") {
    patch.enforceTwoFactor = body.enforceTwoFactor
  }
  if (typeof body.chatRetention === "string") {
    patch.chatRetentionMonths = retentionFromValue(body.chatRetention)
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json(
      { error: "No recognised settings in that request." },
      { status: 400 }
    )
  }

  const settings = await updateAppSettings(patch, guard.userId)

  // One entry per switch that moved, so "turned off new sign-ups" and
  // "enabled Maintenance mode" stay separate events even when saved together.
  const actorName = await actorNameFor(guard.userId)

  for (const key of [
    "maintenanceMode",
    "allowSignUps",
    "enforceTwoFactor",
  ] as const) {
    const value = patch[key]

    if (typeof value !== "boolean") continue

    await recordAdminLog({
      action: LOG_ACTIONS.settingChanged,
      description: describeSettingChange(key, value),
      actorId: guard.userId,
      actorName,
    })
  }

  if (patch.chatRetentionMonths !== undefined) {
    await recordAdminLog({
      action: LOG_ACTIONS.settingChanged,
      description: describeRetentionChange(patch.chatRetentionMonths),
      actorId: guard.userId,
      actorName,
    })
  }

  // Shortening the window should take effect now rather than whenever the next
  // scheduled run happens — an admin who picks "3 months" means the older
  // chats to be gone, not queued.
  let deleted: number | undefined

  if (patch.chatRetentionMonths !== undefined) {
    try {
      ;({ deleted } = await purgeExpiredChats())
    } catch (error) {
      // The setting is saved either way; the purge is retried on the next run.
      console.error("[settings] retention purge failed", error)
    }
  }

  return NextResponse.json({ settings, deleted })
}

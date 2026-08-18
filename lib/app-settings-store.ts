import { cache } from "react"

import { describeChatsPurged, LOG_ACTIONS } from "@/lib/admin-log"
import { recordAdminLog } from "@/lib/admin-log-store"
import { DEFAULT_APP_SETTINGS, type AppSettings } from "@/lib/app-settings"
import { db } from "@/lib/db"

/**
 * Server-only. The one row behind `lib/app-settings.ts`.
 *
 * Read on paths that run for everybody — the `/app` boundary, every sign-up —
 * so reads are cached per request and the row is tiny and unindexed by design:
 * there is only ever one.
 */

/** The single row's id. There is no second one. */
const SETTINGS_ID = "app"

/**
 * The app's settings, or the defaults if nobody has saved any.
 *
 * Never throws and never fails closed: if this row can't be read, the app
 * should keep letting people in rather than lock the door on a database hiccup.
 */
export const getAppSettings = cache(async (): Promise<AppSettings> => {
  try {
    const row = await db.appSetting.findUnique({ where: { id: SETTINGS_ID } })

    if (!row) return DEFAULT_APP_SETTINGS

    return {
      allowSignUps: row.allowSignUps,
      enforceTwoFactor: row.enforceTwoFactor,
      maintenanceMode: row.maintenanceMode,
      chatRetentionMonths: row.chatRetentionMonths,
    }
  } catch (error) {
    console.error("[settings] falling back to defaults", error)

    return DEFAULT_APP_SETTINGS
  }
})

/**
 * Saves the settings an admin changed.
 *
 * Takes a partial: the page sends the one switch that moved, so two admins on
 * the page at once don't overwrite each other's other three fields.
 */
export async function updateAppSettings(
  patch: Partial<AppSettings>,
  updatedByUserId: string
) {
  const row = await db.appSetting.upsert({
    where: { id: SETTINGS_ID },
    create: {
      id: SETTINGS_ID,
      ...DEFAULT_APP_SETTINGS,
      ...patch,
      updatedByUserId,
    },
    update: { ...patch, updatedByUserId },
  })

  return {
    allowSignUps: row.allowSignUps,
    enforceTwoFactor: row.enforceTwoFactor,
    maintenanceMode: row.maintenanceMode,
    chatRetentionMonths: row.chatRetentionMonths,
  }
}

/**
 * Deletes chats past the retention window — what makes the dropdown a policy
 * rather than a preference.
 *
 * Chats only. Documents are the workspace's own uploads and questions are the
 * billing ledger (see `QuestionEvent`); neither is conversation history, and
 * neither is what the setting promises to clear. Messages and citations go with
 * their chat through the schema's cascade.
 *
 * Returns the number of chats deleted, so the caller can report it.
 */
export async function purgeExpiredChats(now: Date = new Date()) {
  const { chatRetentionMonths } = await getAppSettings()

  // "Keep for ever" — nothing to do, and deliberately not a no-op that still
  // scans the table.
  if (chatRetentionMonths === null) return { deleted: 0, cutoff: null }

  const cutoff = new Date(now)
  cutoff.setMonth(cutoff.getMonth() - chatRetentionMonths)

  // Measured from the last message rather than creation, so a long-running
  // conversation isn't deleted out from under someone still using it.
  const { count } = await db.chat.deleteMany({
    where: { updatedAt: { lt: cutoff } },
  })

  // Recorded with no actor: this is the policy running, not a person pressing
  // something, which is what the log renders as "System". Silent deletions are
  // exactly the kind of thing an activity log exists to make visible.
  if (count > 0) {
    await recordAdminLog({
      action: LOG_ACTIONS.chatsPurged,
      description: describeChatsPurged(count, chatRetentionMonths),
    })
  }

  return { deleted: count, cutoff: cutoff.toISOString() }
}

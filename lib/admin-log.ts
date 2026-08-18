import type { PlanId } from "@/lib/billing"
import { planName } from "@/lib/billing"

/**
 * The activity log's shapes and, more importantly, its wording.
 *
 * Every sentence the log can contain is written here, once. An audit entry is
 * stored as the sentence it read as at the time — so these builders are called
 * at the moment of the event, and the result never changes afterwards.
 *
 * Each reads as the predicate after the actor's name: "Ada Lovelace" +
 * "created user grace@meridian.co (Free)".
 */

/** How many entries the page shows. Older ones come out through the CSV. */
export const ADMIN_LOG_PAGE_SIZE = 50

/** What the log calls the app when nobody pressed anything. */
export const SYSTEM_ACTOR = "System"

/** Machine-readable slugs, so the CSV can be filtered without parsing prose. */
export const LOG_ACTIONS = {
  userCreated: "user.created",
  userDeactivated: "user.deactivated",
  userReactivated: "user.reactivated",
  passwordResetSent: "user.password_reset_sent",
  planGranted: "plan.granted",
  settingChanged: "settings.changed",
  chatsPurged: "retention.chats_purged",
} as const

export type LogAction = (typeof LOG_ACTIONS)[keyof typeof LOG_ACTIONS]

export type AdminLogEntry = {
  id: string
  /** The admin's name, or "System". */
  actor: string
  action: string
  /** The sentence after the actor's name. */
  description: string
  /** ISO timestamp. */
  createdAt: string
}

/* --- the sentences ------------------------------------------------------ */

export function describeUserCreated(email: string, planId: PlanId) {
  return `created user ${email} (${planName(planId)})`
}

export function describePlanGranted(subject: string, planId: PlanId) {
  return `upgraded ${subject} to ${planName(planId)}`
}

export function describeDeactivated(subject: string) {
  return `deactivated ${subject}`
}

export function describeReactivated(subject: string) {
  return `reactivated ${subject}`
}

export function describePasswordReset(email: string) {
  return `sent a password reset to ${email}`
}

/** "enabled Maintenance mode", "turned off new sign-ups". */
export function describeSettingChange(
  key: "maintenanceMode" | "allowSignUps" | "enforceTwoFactor",
  value: boolean
) {
  switch (key) {
    case "maintenanceMode":
      return `${value ? "enabled" : "disabled"} Maintenance mode`
    case "allowSignUps":
      return `turned ${value ? "on" : "off"} new sign-ups`
    case "enforceTwoFactor":
      return `${value ? "enabled" : "disabled"} enforced two-factor authentication`
  }
}

export function describeRetentionChange(months: number | null) {
  return months === null
    ? "turned off automatic chat deletion"
    : `set data retention to ${months} months`
}

export function describeChatsPurged(count: number, months: number) {
  return `deleted ${count} chat${count === 1 ? "" : "s"} older than ${months} months`
}

/**
 * "2h ago", "1w ago" — the timestamp on the right of a row.
 *
 * Weeks here, unlike the Users table's day-counting: this column is read as
 * "how recently", not measured against a 30-day window.
 */
export function logAge(iso: string, now: Date = new Date()) {
  const seconds = Math.max(0, (now.getTime() - new Date(iso).getTime()) / 1000)
  const minutes = seconds / 60
  const hours = minutes / 60
  const days = hours / 24

  if (seconds < 60) return "just now"
  if (minutes < 60) return `${Math.floor(minutes)}m ago`
  if (hours < 24) return `${Math.floor(hours)}h ago`
  if (days < 7) return `${Math.floor(days)}d ago`
  if (days < 30) return `${Math.floor(days / 7)}w ago`
  if (days < 365) return `${Math.floor(days / 30)}mo ago`

  return `${Math.floor(days / 365)}y ago`
}

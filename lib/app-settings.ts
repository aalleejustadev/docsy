/**
 * The app's own switches — the Security tab's shapes and copy, with no
 * database behind them, so client components can import this freely.
 *
 * Everything here is app-wide rather than per-workspace: these are decisions
 * about how Docsy itself behaves, which is why they live in a single row and
 * are only reachable from the admin console.
 */

export type AppSettings = {
  allowSignUps: boolean
  enforceTwoFactor: boolean
  maintenanceMode: boolean
  /** Months of chat history kept; null keeps everything. */
  chatRetentionMonths: number | null
}

/**
 * What the app runs on before anyone opens the page — and what
 * `getAppSettings` falls back to if the row is missing.
 *
 * Chosen so a missing row can't lock anybody out: registration open,
 * maintenance off. `12` matches the reference screenshot.
 */
export const DEFAULT_APP_SETTINGS: AppSettings = {
  allowSignUps: true,
  enforceTwoFactor: false,
  maintenanceMode: false,
  chatRetentionMonths: 12,
}

/** The retention dropdown. `null` is "Keep for ever" — no purge runs at all. */
export const RETENTION_OPTIONS: { value: string; label: string }[] = [
  { value: "3", label: "3 months" },
  { value: "6", label: "6 months" },
  { value: "12", label: "12 months" },
  { value: "24", label: "24 months" },
  { value: "never", label: "Keep for ever" },
]

/** The `<Select>` speaks strings; the column is a nullable number. */
export function retentionToValue(months: number | null) {
  return months === null ? "never" : String(months)
}

export function retentionFromValue(value: string): number | null {
  if (value === "never") return null

  const months = Number.parseInt(value, 10)

  return Number.isFinite(months) && months > 0 ? months : null
}

/** The toggles, in the order the reference lists them. */
export type ToggleSettingKey =
  "enforceTwoFactor" | "allowSignUps" | "maintenanceMode"

export type ToggleSetting = {
  key: ToggleSettingKey
  title: string
  description: string
  /**
   * Set when the switch can't be honoured yet — it renders disabled with this
   * as the reason. A toggle that saves but changes nothing is worse than one
   * that says why it's off.
   */
  unavailable?: string
}

export const TOGGLE_SETTINGS: ToggleSetting[] = [
  {
    key: "enforceTwoFactor",
    title: "Enforce two-factor authentication",
    description: "Every user must enable 2FA to access the app.",
    unavailable:
      "Docsy doesn't offer two-factor sign-in yet, so there's nothing to enforce.",
  },
  {
    key: "allowSignUps",
    title: "Allow new sign-ups",
    description: "Let new people register from the marketing site.",
  },
  {
    key: "maintenanceMode",
    title: "Maintenance mode",
    description: "Temporarily take the app offline for everyone but admins.",
  },
]

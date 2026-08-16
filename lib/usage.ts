import { APP_ROOT } from "@/lib/dashboard-nav"

/**
 * The usage page's shapes and its one piece of date arithmetic.
 *
 * The allowance window is the calendar month, because that is what the quota
 * actually resets on — `countQuestionsThisMonth` counts from the 1st. There is
 * no subscription behind it, so this page says "allowance", not "billing".
 */

export const USAGE_ROUTE = `${APP_ROOT}/usage`

/** Days of history in the "Questions per day" chart. */
export const USAGE_CHART_DAYS = 14

/** How many documents the "most-questioned" list shows. */
export const USAGE_TOP_DOCUMENTS = 5

export type UsagePeriod = {
  /** ISO dates for the first and last day of the current allowance month. */
  start: string
  end: string
  /** Whole days until the allowance resets. Zero means it resets today. */
  resetsInDays: number
}

/** The month the question allowance is counted over, and when it rolls over. */
export function usagePeriod(now: Date = new Date()): UsagePeriod {
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const nextStart = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  // The last day of this month is the day before the next month begins.
  const end = new Date(nextStart.getTime() - 1)

  // Compared date-to-date rather than by elapsed milliseconds, so an allowance
  // rolling over tomorrow morning reads as "1 day", not "0" at 11pm tonight.
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const resetsInDays = Math.round(
    (nextStart.getTime() - today.getTime()) / 86_400_000
  )

  return {
    start: start.toISOString(),
    end: end.toISOString(),
    resetsInDays,
  }
}

/** "Aug 1 – Aug 31, 2026". */
export function formatPeriod(period: UsagePeriod) {
  const start = new Date(period.start)
  const end = new Date(period.end)
  const day = (date: Date) =>
    date.toLocaleDateString("en-US", { month: "short", day: "numeric" })

  return `${day(start)} – ${day(end)}, ${end.getFullYear()}`
}

/** "1.1s", "19s", "2m 04s" — an answer's wall-clock time, read at a glance. */
export function formatDuration(seconds: number) {
  if (seconds < 10) return `${seconds.toFixed(1)}s`
  if (seconds < 60) return `${Math.round(seconds)}s`

  const minutes = Math.floor(seconds / 60)

  return `${minutes}m ${String(Math.round(seconds % 60)).padStart(2, "0")}s`
}

/** One column of the questions-per-day chart. */
export type UsageDay = {
  /** `YYYY-MM-DD`, the local day the questions were asked on. */
  date: string
  questions: number
}

/** A row of the "most-questioned documents" list. */
export type UsageDocument = {
  id: string
  name: string
  /** Answers that cited this document — see `getUsage` for why that's the count. */
  questions: number
}

export type UsageView = {
  period: UsagePeriod
  /** Questions asked in the current allowance month. */
  questions: number
  questionLimit: number
  documentsIndexed: number
  /** Citations across every answer Docsy has written for this workspace. */
  citations: number
  /** Mean seconds from question to finished answer; null with nothing to time. */
  averageAnswerSeconds: number | null
  days: UsageDay[]
  documents: UsageDocument[]
}

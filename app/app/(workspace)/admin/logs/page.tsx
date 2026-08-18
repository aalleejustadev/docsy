import type { Metadata } from "next"

import { listAdminLog } from "@/lib/admin-log-store"
import { requireAdmin } from "@/lib/session"
import { AdminActivityLog } from "@/components/admin/logs/admin-activity-log"

export const metadata: Metadata = {
  title: "Logs · Admin",
}

/**
 * `/app/admin/logs` — the Logs tab.
 *
 * Reads the most recent entries only. There's no pager in the reference and the
 * log grows without bound, so the page stays a short "what happened lately" and
 * the CSV export is the way to read the whole thing.
 *
 * Guarded here as well as in the layout — layouts and pages render at the same
 * time, so this is what keeps the log off a non-admin's screen.
 */
export default async function AdminLogsPage() {
  await requireAdmin()

  const entries = await listAdminLog()

  return <AdminActivityLog entries={entries} />
}

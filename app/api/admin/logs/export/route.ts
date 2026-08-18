import { requireApiAdmin } from "@/lib/api-session"
import { adminLogToCsv, listAdminLogForExport } from "@/lib/admin-log-store"

/**
 * "Export CSV" on the Logs tab.
 *
 * A GET rather than a POST because it's a plain download — the button is a
 * link, so the browser saves the file itself instead of the page building a
 * blob it then has to clean up.
 *
 * Guarded like every other admin endpoint: the log names accounts and what was
 * done to them, which is not something to hand out on a guessable URL.
 */
export async function GET() {
  const guard = await requireApiAdmin()
  if (!guard.ok) return guard.response

  const entries = await listAdminLogForExport()
  const csv = adminLogToCsv(entries)
  const date = new Date().toISOString().slice(0, 10)

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="docsy-activity-log-${date}.csv"`,
      // The log changes constantly and the download is per-admin; caching it
      // anywhere would serve one admin's export to the next request.
      "Cache-Control": "no-store, private",
    },
  })
}

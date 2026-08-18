import { ClockIcon, DownloadIcon } from "lucide-react"

import { logAge, type AdminLogEntry } from "@/lib/admin-log"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Separator } from "@/components/ui/separator"

/**
 * The activity log — `ui-design/dashboard/light/admin-logs-page.png`.
 *
 * Each row is a sentence with the actor in bold at the front, exactly as it was
 * written when the event happened: the log stores the finished wording rather
 * than rebuilding it from ids, so an entry still reads correctly after the
 * account it names has been renamed or deleted.
 */
function AdminActivityLog({ entries }: { entries: AdminLogEntry[] }) {
  return (
    <Card className="gap-0 py-0">
      <CardHeader className="flex flex-row items-center justify-between gap-4 px-6 py-4">
        <CardTitle className="text-base font-semibold">Activity log</CardTitle>

        {/* A real download, not a client-side blob: the export covers every
            entry, not just the page's most recent few. */}
        <Button
          variant="outline"
          size="lg"
          nativeButton={false}
          className="cursor-pointer px-4"
          render={<a href="/api/admin/logs/export" download />}
        >
          <DownloadIcon data-icon="inline-start" />
          Export CSV
        </Button>
      </CardHeader>

      <Separator />

      <CardContent className="flex flex-col p-0">
        {entries.length === 0 ? (
          <Empty className="py-12">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <ClockIcon />
              </EmptyMedia>
              <EmptyTitle>Nothing has happened yet</EmptyTitle>
              <EmptyDescription>
                Creating a user, deactivating an account or changing a security
                setting all show up here.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          entries.map((entry, index) => (
            <div key={entry.id}>
              {index > 0 && <Separator />}

              <div className="flex items-center gap-4 px-6 py-4">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <ClockIcon className="size-4" />
                </span>

                {/* `wrap-anywhere` because these sentences end in email
                    addresses, which have nowhere to break: on a phone the
                    address kept its line and slid underneath the timestamp. */}
                <p className="min-w-0 flex-1 text-sm wrap-anywhere">
                  <span className="font-semibold">{entry.actor}</span>{" "}
                  {entry.description}
                </p>

                <time
                  dateTime={entry.createdAt}
                  // The full timestamp on hover: the relative age is the quick
                  // read, and an auditor eventually wants the actual moment.
                  title={new Date(entry.createdAt).toLocaleString()}
                  className="shrink-0 font-mono text-sm text-muted-foreground"
                >
                  {logAge(entry.createdAt)}
                </time>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}

export { AdminActivityLog }

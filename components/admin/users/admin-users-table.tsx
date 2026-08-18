import {
  adminUsersHref,
  ADMIN_USERS_PAGE_SIZE,
  lastActiveLabel,
  type AdminUserStatus,
} from "@/lib/admin"
import { getAdminUsers } from "@/lib/admin-store"
import { planName } from "@/lib/billing"
import { rangeLabel } from "@/lib/pagination"
import { requireAdmin } from "@/lib/session"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { UserAvatar } from "@/components/auth/user-avatar"
import { Pager } from "@/components/dashboard/pager"
import { AdminUserRowActions } from "@/components/admin/users/admin-user-row-actions"

const headCell =
  "h-11 px-6 text-[0.6875rem] font-bold tracking-[0.08em] text-muted-foreground uppercase"

/** The user column takes what's left; the rest are pinned. */
const columns = [
  { label: "User", className: "w-full" },
  { label: "Plan", className: "w-32" },
  { label: "Status", className: "w-36" },
  { label: "Last active", className: "w-36" },
]

/**
 * Status travels as a dot *and* a word, so the meaning survives for anyone who
 * can't separate the amber from the grey.
 */
const STATUS: Record<
  AdminUserStatus,
  { label: string; dot: string; text: string }
> = {
  active: { label: "Active", dot: "bg-brand", text: "text-brand" },
  inactive: {
    label: "Inactive",
    dot: "bg-muted-foreground",
    text: "text-muted-foreground",
  },
  deactivated: {
    label: "Deactivated",
    dot: "bg-destructive",
    text: "text-destructive",
  },
}

/**
 * The users table and its pager —
 * `ui-design/dashboard/light/admin-users-page.png`.
 *
 * Fetches its own rows rather than being handed them, so the page can put it
 * behind a Suspense boundary and let the toolbar paint first. Guarded here as
 * well as in the layout: a layout and its page render concurrently, so this is
 * what stops the query running for someone who isn't an admin.
 */
async function AdminUsersTable({
  query,
  page,
}: {
  query: string
  page: number
}) {
  await requireAdmin()

  const {
    users,
    total,
    pageCount,
    page: current,
  } = await getAdminUsers({
    query,
    page,
  })

  return (
    <div className="mt-5 overflow-hidden rounded-xl border bg-card">
      {/* `table-fixed` alone let the pinned columns eat the whole width on a
          phone — 128 + 144 + 144 + 64 is already 480px, which left the User
          column at *zero* and hid every name and email. A minimum width makes
          the table overflow its container instead, and `Table` wraps that in a
          horizontal scroller. */}
      <Table className="min-w-184 table-fixed">
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            {columns.map((column) => (
              <TableHead
                key={column.label}
                className={cn(headCell, column.className)}
              >
                {column.label}
              </TableHead>
            ))}

            <TableHead className="w-16 px-6">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {users.length === 0 ? (
            <TableRow className="hover:bg-transparent">
              <TableCell
                colSpan={5}
                className="h-32 px-6 text-center text-sm text-muted-foreground"
              >
                No users match that search.
              </TableCell>
            </TableRow>
          ) : (
            users.map((user) => {
              const status = STATUS[user.status]

              return (
                <TableRow key={user.id}>
                  <TableCell className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <UserAvatar
                        user={user}
                        className="size-9 **:data-[slot=avatar-fallback]:bg-muted **:data-[slot=avatar-fallback]:text-muted-foreground"
                      />

                      <div className="min-w-0">
                        <p className="truncate font-semibold">
                          {user.name || user.email}
                        </p>
                        <p className="truncate text-sm text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="px-6">
                    {/* The paid plans are worth spotting at a glance; Free is
                        the default and reads as an outline. */}
                    <Badge
                      variant={user.planId === "free" ? "outline" : undefined}
                      className={cn(
                        "rounded-md font-mono text-[0.6875rem] font-bold",
                        user.planId === "business" && "bg-brand/15 text-brand",
                        user.planId === "pro" &&
                          "border border-border bg-background text-foreground"
                      )}
                    >
                      {planName(user.planId)}
                    </Badge>
                  </TableCell>

                  <TableCell className="px-6">
                    <span
                      className={cn(
                        "flex items-center gap-2 font-mono text-sm",
                        status.text
                      )}
                    >
                      <span
                        aria-hidden
                        className={cn(
                          "size-1.5 shrink-0 rounded-full",
                          status.dot
                        )}
                      />
                      {status.label}
                    </span>
                  </TableCell>

                  <TableCell className="px-6 font-mono text-sm text-muted-foreground">
                    {lastActiveLabel(user.lastActive)}
                  </TableCell>

                  <TableCell className="px-6 text-right">
                    <AdminUserRowActions user={user} />
                  </TableCell>
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>

      <div className="flex flex-wrap items-center justify-between gap-4 border-t px-6 py-4">
        <p className="font-mono text-sm text-muted-foreground">
          {rangeLabel({
            page: current,
            total,
            pageSize: ADMIN_USERS_PAGE_SIZE,
            noun: "user",
          })}
        </p>

        <Pager
          page={current}
          pageCount={pageCount}
          hrefFor={(target) => adminUsersHref({ query, page: target })}
        />
      </div>
    </div>
  )
}

export { AdminUsersTable }

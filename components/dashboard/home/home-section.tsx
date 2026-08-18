import Link from "next/link"

/**
 * A titled list with one trailing link — the shape both "Recent chats" and
 * "Recent documents" take in `dashboard-home.png`.
 */
function HomeSection({
  title,
  action,
  children,
}: {
  title: string
  /** The link on the right of the heading, e.g. "View all". Omit for none. */
  action?: { href: string; label: string }
  children: React.ReactNode
}) {
  return (
    // `min-w-0` because these sit in a grid, and a grid item's default
    // `min-width: auto` sizes the track to its widest content — one long
    // filename was stretching the card past the screen and stopping the
    // truncation inside it from ever applying.
    <section className="min-w-0">
      <div className="flex items-baseline justify-between gap-4">
        <h3 className="font-semibold">{title}</h3>

        {action && (
          <Link
            href={action.href}
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            {action.label}
          </Link>
        )}
      </div>

      <div className="mt-4 divide-y overflow-hidden rounded-xl border bg-card">
        {children}
      </div>
    </section>
  )
}

export { HomeSection }

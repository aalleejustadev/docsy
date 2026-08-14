import { Button } from "@/components/ui/button"

const DANGER_ACTIONS = [
  {
    id: "clear-history",
    title: "Clear chat history",
    description: "Delete every conversation. Your documents stay indexed.",
    action: "Clear history",
    destructive: false,
  },
  {
    id: "clear-library",
    title: "Clear all documents",
    description: "Delete every document and its embeddings from your library.",
    action: "Clear library",
    destructive: false,
  },
  {
    id: "delete-account",
    title: "Delete account",
    description:
      "Permanently remove your account, documents, and chat history.",
    action: "Delete account",
    destructive: true,
  },
]

/**
 * The Danger zone tab — `ui-design/dashboard/light/dashboard-danger-zone.png`.
 *
 * Presentational for now: none of these are wired up, and when they are, each
 * one gets an `AlertDialog` confirmation before it runs.
 */
function DangerZoneSettings() {
  return (
    <div className="overflow-hidden rounded-xl border border-destructive/50">
      <div className="bg-destructive/5 p-6">
        <h2 className="font-heading text-lg font-semibold text-destructive">
          Danger zone
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          These actions are permanent and cannot be undone.
        </p>
      </div>

      <div className="divide-y border-t border-destructive/50">
        {DANGER_ACTIONS.map((item) => (
          <div
            key={item.id}
            className="flex flex-wrap items-center justify-between gap-4 p-6"
          >
            <div>
              <p className="font-semibold">{item.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {item.description}
              </p>
            </div>

            {item.destructive ? (
              <Button
                size="lg"
                className="cursor-pointer bg-destructive px-4 text-white hover:bg-destructive/90"
              >
                {item.action}
              </Button>
            ) : (
              <Button
                variant="outline"
                size="lg"
                className="cursor-pointer border-destructive/50 px-4 text-destructive hover:bg-destructive/5 hover:text-destructive"
              >
                {item.action}
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export { DangerZoneSettings }

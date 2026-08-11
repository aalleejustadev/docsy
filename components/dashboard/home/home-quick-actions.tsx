import { PlusIcon, UploadIcon } from "lucide-react"

/**
 * The two things a new session starts with — `dashboard-home.png`, with the
 * upload card's hover state from `upload-doc__hover-state.png`.
 *
 * Neither is wired up yet: chat and upload land in a later pass.
 */
function HomeQuickActions() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <button
        type="button"
        className="flex cursor-pointer items-center gap-4 rounded-xl border bg-card p-5 text-left transition-colors hover:bg-accent/50"
      >
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <PlusIcon className="size-5" />
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="font-semibold">Start a new chat</span>
          <span className="truncate text-sm text-muted-foreground">
            Ask across your library
          </span>
        </span>
      </button>

      <button
        type="button"
        className="group flex cursor-pointer items-center gap-4 rounded-xl border border-dashed bg-surface p-5 text-left transition-colors hover:border-brand"
      >
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-brand">
          <UploadIcon className="size-5" />
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="font-semibold">Upload documents</span>
          <span className="truncate text-sm text-muted-foreground">
            PDF, Word, slides, scans
          </span>
        </span>
      </button>
    </div>
  )
}

export { HomeQuickActions }

import { cn } from "@/lib/utils"
import { SpinnerRing } from "@/components/common/spinner-ring"

/**
 * Fills the pane while the workspace is being created —
 * `ui-design/dashboard/light/dashboard-organisation-loading-state.png`.
 */
function OrganizationSetupLoading({
  name,
  className,
}: {
  /** The workspace being created, so the wait names what it's waiting for. */
  name: string
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex flex-1 flex-col items-center justify-center gap-6 px-6 py-24",
        className
      )}
    >
      <SpinnerRing
        aria-label={`Setting up ${name}`}
        className="size-8 border-muted border-t-brand"
      />
      <p className="text-muted-foreground">Setting up {name}…</p>
    </div>
  )
}

export { OrganizationSetupLoading }

import { cn } from "@/lib/utils"

/**
 * The ring spinner from the organization setup screen, sized down for buttons:
 * a track with one bright quarter turning. Colours come from `currentColor`,
 * so dropping it inside a button picks up that button's ink.
 */
function SpinnerRing({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={cn(
        "size-4 shrink-0 animate-spin rounded-full border-2 border-current/25 border-t-current",
        className
      )}
      {...props}
    />
  )
}

export { SpinnerRing }

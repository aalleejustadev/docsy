import { Spinner } from "@/components/ui/spinner"

/**
 * Sits inside the workspace chrome, so the sidebar and header don't flicker.
 *
 * The height is explicit rather than `flex-1`: the layout drops children into
 * a plain `div`, so there is no flex parent to grow into and the spinner would
 * sit just under the header instead of in the middle. `4rem` is the header.
 */
export default function Loading() {
  return (
    <div className="flex min-h-[calc(100svh-4rem)] items-center justify-center">
      <Spinner className="size-6 text-muted-foreground" />
    </div>
  )
}

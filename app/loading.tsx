import { Spinner } from "@/components/ui/spinner"

/**
 * The fallback while any route below is still resolving.
 *
 * Full-height and centred, because at this level there's no chrome to sit
 * inside — the segments under `/app` have their own `loading.tsx` so their
 * sidebar and header stay put while only the content swaps.
 */
export default function Loading() {
  return (
    <div className="flex min-h-svh items-center justify-center">
      <Spinner className="size-6 text-muted-foreground" />
    </div>
  )
}

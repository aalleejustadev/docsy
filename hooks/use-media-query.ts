import * as React from "react"

/**
 * Tracks a CSS media query from React.
 *
 * `useSyncExternalStore` rather than effect-plus-state: matchMedia is an
 * external store, so subscribing to it directly avoids the extra render that
 * setting state on mount would cause, and keeps the value correct if the query
 * changes between renders.
 *
 * The server snapshot is `false`, so anything gated on this renders the narrow
 * case until hydration — which is the safe direction, since the narrow case is
 * an overlay rather than a layout column.
 */
export function useMediaQuery(query: string) {
  const subscribe = React.useCallback(
    (onChange: () => void) => {
      const list = window.matchMedia(query)
      list.addEventListener("change", onChange)

      return () => list.removeEventListener("change", onChange)
    },
    [query]
  )

  return React.useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false
  )
}

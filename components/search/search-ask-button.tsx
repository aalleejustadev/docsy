import { SearchIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Kbd } from "@/components/ui/kbd"

/**
 * The dashboard's search affordance — shaped like an input, but a button,
 * because it opens the command palette rather than accepting typing in place.
 * `ui-design/dashboard/light/dashboard-header.png`.
 */
function SearchAskButton({ className }: { className?: string }) {
  return (
    <Button
      variant="outline"
      size="lg"
      className={cn(
        "w-64 justify-start gap-2.5 pr-1.5 pl-2.5 font-normal",
        className
      )}
    >
      <SearchIcon className="text-muted-foreground" />
      <span className="text-muted-foreground">Search or ask…</span>
      <Kbd className="ml-auto">⌘K</Kbd>
    </Button>
  )
}

export { SearchAskButton }

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Kbd } from "@/components/ui/kbd"

function SearchDocsButton({
  className,
  showShortcut = true,
}: {
  className?: string
  showShortcut?: boolean
}) {
  return (
    <Button
      variant="outline"
      className={cn("gap-3", showShortcut && "pr-1.5", className)}
    >
      <span className="font-normal text-muted-foreground">Search docs</span>
      {showShortcut && <Kbd className="ml-auto">⌘K</Kbd>}
    </Button>
  )
}

export { SearchDocsButton }

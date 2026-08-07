import { cn } from "@/lib/utils"

const DELAYS = ["[animation-delay:0ms]", "[animation-delay:200ms]", "[animation-delay:400ms]"]

/**
 * Three-dot "typing…" indicator, WhatsApp style. Purely decorative CSS
 * animation — see the `typing-dot` keyframes in `app/globals.css`.
 */
function TypingDots({
  className,
  label = "Docsy is typing",
}: {
  className?: string
  label?: string
}) {
  return (
    <span
      role="status"
      aria-label={label}
      className={cn("inline-flex items-center gap-1", className)}
    >
      {DELAYS.map((delay) => (
        <span
          key={delay}
          className={cn(
            "size-1.5 animate-typing-dot rounded-full bg-muted-foreground motion-reduce:animate-none",
            delay
          )}
        />
      ))}
    </span>
  )
}

export { TypingDots }

import { cn } from "@/lib/utils"

function DocsyMark({ className, ...props }: React.ComponentProps<"svg">) {
  return (
    <svg
      viewBox="0 0 32 32"
      aria-hidden="true"
      className={cn("size-8", className)}
      {...props}
    >
      <rect width="32" height="32" rx="7.5" className="fill-foreground" />
      <rect
        x="8.5"
        y="8"
        width="15"
        height="2.5"
        rx="1.25"
        className="fill-muted-foreground"
      />
      <rect
        x="8.5"
        y="14"
        width="15"
        height="4"
        rx="2"
        className="fill-brand"
      />
      <rect
        x="8.5"
        y="21.5"
        width="10"
        height="2.5"
        rx="1.25"
        className="fill-muted-foreground"
      />
    </svg>
  )
}

const MARK_SIZES = {
  default: "size-8",
  sm: "size-7",
}

const WORDMARK_SIZES = {
  default: "text-lg",
  sm: "text-base",
}

function DocsyLogo({
  size = "default",
  className,
  ...props
}: React.ComponentProps<"span"> & { size?: keyof typeof MARK_SIZES }) {
  return (
    <span className={cn("flex items-center gap-2.5", className)} {...props}>
      <DocsyMark className={MARK_SIZES[size]} />
      <span
        className={cn(
          "font-heading font-bold tracking-tight",
          WORDMARK_SIZES[size]
        )}
      >
        Docsy
      </span>
    </span>
  )
}

export { DocsyLogo, DocsyMark }

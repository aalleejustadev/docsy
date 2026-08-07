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

function DocsyLogo({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span className={cn("flex items-center gap-2.5", className)} {...props}>
      <DocsyMark />
      <span className="font-heading text-lg font-bold tracking-tight">
        Docsy
      </span>
    </span>
  )
}

export { DocsyLogo, DocsyMark }

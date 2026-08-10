import { ArrowRightIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { AuthDialogTrigger } from "@/components/auth/auth-dialog-trigger"

function FooterCta() {
  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-8 lg:py-12">
      <div className="surface-inverted relative overflow-hidden rounded-3xl bg-background text-foreground">
        {/* Warm glow spilling in from the top edge, present in both themes. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-radial-[at_50%_0%] from-brand/20 to-transparent to-65%"
        />

        <div className="relative flex flex-col items-center gap-6 px-6 py-20 text-center">
          <h2 className="text-4xl leading-[1.05] font-bold tracking-tight sm:text-5xl">
            <span className="block">Stop skimming.</span>
            <span className="block">Start asking.</span>
          </h2>

          <p className="max-w-md text-lg leading-relaxed text-muted-foreground">
            Upload your first documents and get cited answers in minutes. Free
            for 5 files — no card required.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row">
            <AuthDialogTrigger
              mode="sign-up"
              className="h-11 bg-brand px-5 text-base text-brand-foreground hover:bg-brand/90 has-data-[icon=inline-end]:pr-5"
            >
              Try Docsy free
              <ArrowRightIcon data-icon="inline-end" />
            </AuthDialogTrigger>
            <Button variant="outline" className="h-11 px-5 text-base">
              Try the ⌘K search
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}

export { FooterCta }

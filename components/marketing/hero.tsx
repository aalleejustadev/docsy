import Link from "next/link"
import { ArrowRightIcon, CheckIcon, PlayIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { HeroPreview } from "@/components/marketing/hero-preview"
import { TrustedBy } from "@/components/marketing/trusted-by"

const PROOF_POINTS = ["Free for 5 documents", "No card required"]

/** Keeps the icon-side padding symmetric — `Button` tightens it by default. */
const CTA_CLASSES =
  "h-11 w-full px-5 text-base has-data-[icon=inline-end]:pr-5 has-data-[icon=inline-start]:pl-5 sm:w-auto"

function Hero() {
  return (
    <section className="mx-auto w-full max-w-6xl px-6 pt-16 pb-13 lg:pt-24 lg:pb-19">
      <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div className="flex flex-col items-start gap-6">
          <Badge
            variant="outline"
            className="h-7 gap-2 px-3 text-sm font-normal text-muted-foreground"
          >
            <span aria-hidden className="size-1.5 rounded-full bg-brand" />
            Grounded answers — a citation for every claim
          </Badge>

          <h1 className="text-4xl leading-[1.05] font-bold tracking-tight sm:text-5xl lg:text-6xl">
            <span className="block">Chat with your documents.</span>
            <span className="relative inline-block">
              <span
                aria-hidden
                className="absolute inset-x-0 bottom-[0.06em] h-[0.24em] bg-brand/25"
              />
              <span className="relative">Verify every word.</span>
            </span>
          </h1>

          <p className="max-w-lg text-lg leading-relaxed text-muted-foreground">
            Docsy reads your PDFs, contracts, and reports, then answers in plain
            language — with a link to the exact passage behind every claim. No
            more Ctrl-F. No skimming. No hallucinations.
          </p>

          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Button
              className={CTA_CLASSES}
              render={<Link href="/sign-up" />}
              nativeButton={false}
            >
              Try Docsy free
              <ArrowRightIcon data-icon="inline-end" />
            </Button>
            <Button
              variant="outline"
              className={CTA_CLASSES}
              render={<Link href="#how-it-works" />}
              nativeButton={false}
            >
              <PlayIcon data-icon="inline-start" className="fill-current" />
              See how it works
            </Button>
          </div>

          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {PROOF_POINTS.map((point) => (
              <li
                key={point}
                className="flex items-center gap-1.5 text-sm text-muted-foreground"
              >
                <CheckIcon className="size-4 text-brand" />
                {point}
              </li>
            ))}
          </ul>
        </div>

        <HeroPreview />
      </div>

      <TrustedBy className="mt-20 lg:mt-28" />
    </section>
  )
}

export { Hero }

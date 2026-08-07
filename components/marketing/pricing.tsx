"use client"

import * as React from "react"
import Link from "next/link"

import { PLANS, type BillingPeriod } from "@/lib/pricing"
import { BillingToggle } from "@/components/marketing/billing-toggle"
import { PricingCard } from "@/components/marketing/pricing-card"
import { SectionHeading } from "@/components/marketing/section-heading"

function Pricing() {
  const [period, setPeriod] = React.useState<BillingPeriod>("annual")

  return (
    <section id="pricing" className="scroll-mt-16 border-y bg-surface">
      <div className="mx-auto w-full max-w-6xl px-6 py-16 lg:py-24">
        <SectionHeading
          className="mx-auto max-w-160 items-center text-center"
          eyebrow="Pricing"
          title="Start free. Upgrade when the answers pay for themselves."
        />

        <BillingToggle
          className="mt-8"
          value={period}
          onValueChange={setPeriod}
        />

        <div className="mx-auto mt-10 grid max-w-5xl items-start gap-5 md:grid-cols-3">
          {PLANS.map((plan) => (
            <PricingCard key={plan.id} plan={plan} period={period} />
          ))}
        </div>

        <p className="mt-10 text-center text-sm text-muted-foreground">
          Questions are the only limit that changes between plans.{" "}
          <Link href="/contact" className="font-semibold text-brand">
            Talk to us
          </Link>{" "}
          about custom volumes.
        </p>
      </div>
    </section>
  )
}

export { Pricing }

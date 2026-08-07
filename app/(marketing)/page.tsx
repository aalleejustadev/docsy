import { EverythingInOneWorkspace } from "@/components/marketing/everything-in-one-workspace"
import { Faqs } from "@/components/marketing/faqs"
import { Hero } from "@/components/marketing/hero"
import { HowItWorks } from "@/components/marketing/how-it-works"
import { Pricing } from "@/components/marketing/pricing"
import { Privacy } from "@/components/marketing/privacy"
import { Stats } from "@/components/marketing/stats"
import { Testimonials } from "@/components/marketing/testimonials"

export default function Page() {
  return (
    <>
      <Hero />
      <HowItWorks />
      <EverythingInOneWorkspace />
      <Privacy />
      <Stats />
      <Testimonials />
      <Pricing />
      <Faqs />
      {/* Remaining landing sections (footer CTA, footer) go here. */}
    </>
  )
}

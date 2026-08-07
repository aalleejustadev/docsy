import { EverythingInOneWorkspace } from "@/components/marketing/everything-in-one-workspace"
import { Hero } from "@/components/marketing/hero"
import { HowItWorks } from "@/components/marketing/how-it-works"
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
      {/* Remaining landing sections (pricing, FAQs, footer, …) go here. */}
    </>
  )
}

import { EverythingInOneWorkspace } from "@/components/marketing/everything-in-one-workspace"
import { Hero } from "@/components/marketing/hero"
import { HowItWorks } from "@/components/marketing/how-it-works"
import { Privacy } from "@/components/marketing/privacy"
import { Stats } from "@/components/marketing/stats"

export default function Page() {
  return (
    <>
      <Hero />
      <HowItWorks />
      <EverythingInOneWorkspace />
      <Privacy />
      <Stats />
      {/* Remaining landing sections (testimonials, pricing, FAQs, …) go here. */}
    </>
  )
}

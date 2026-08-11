import { redirectIfSignedIn } from "@/lib/session"
import { EverythingInOneWorkspace } from "@/components/marketing/everything-in-one-workspace"
import { Faqs } from "@/components/marketing/faqs"
import { FooterCta } from "@/components/marketing/footer-cta"
import { Hero } from "@/components/marketing/hero"
import { HowItWorks } from "@/components/marketing/how-it-works"
import { Pricing } from "@/components/marketing/pricing"
import { Privacy } from "@/components/marketing/privacy"
import { Stats } from "@/components/marketing/stats"
import { Testimonials } from "@/components/marketing/testimonials"

export default async function Page() {
  // The landing page is for visitors — anyone with a session belongs in /app.
  await redirectIfSignedIn()

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
      <FooterCta />
    </>
  )
}

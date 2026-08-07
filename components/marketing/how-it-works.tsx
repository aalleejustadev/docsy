import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { SectionHeading } from "@/components/marketing/section-heading"

const STEPS = [
  {
    number: "01",
    title: "Upload & index",
    description:
      "Drop in files or whole folders — 40+ formats. Scans are OCR'd automatically and embedded into your private, searchable vector store.",
  },
  {
    number: "02",
    title: "Ask in plain language",
    description:
      "Ask across one document or your entire library. Docsy streams back an answer and pulls from exactly the right files.",
  },
  {
    number: "03",
    title: "Verify in one click",
    description:
      "Every claim carries a citation. Open the source reader to see the exact highlighted passage and page it came from.",
  },
]

function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="mx-auto w-full max-w-6xl scroll-mt-16 px-6 pt-13 pb-16 lg:pt-19 lg:pb-24"
    >
      <SectionHeading
        className="max-w-160"
        eyebrow="How it works"
        title="From a folder of files to a trusted answer in three steps."
      />

      <div className="mt-14 grid gap-6 md:grid-cols-3">
        {STEPS.map((step) => (
          <Card key={step.number} className="[--card-spacing:--spacing(6)]">
            <CardHeader className="gap-2.5">
              <span className="mb-3 font-mono text-sm font-bold text-brand">
                {step.number}
              </span>
              <CardTitle className="text-lg font-semibold">
                {step.title}
              </CardTitle>
              <CardDescription className="text-[0.9375rem] leading-relaxed">
                {step.description}
              </CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
    </section>
  )
}

export { HowItWorks }

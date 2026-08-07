import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { SectionHeading } from "@/components/marketing/section-heading"

const TESTIMONIALS = [
  {
    quote:
      '"I stopped re-reading 80-page contracts to find one clause. Docsy answers and shows me the exact line — I verify in a click instead of an hour."',
    name: "Dana Reyes",
    initials: "DR",
    role: "Counsel · Northwind Legal",
  },
  {
    quote:
      '"Multi-doc search across a quarter of filings is the feature I didn\'t know I needed. Every figure it returns is traceable to the page."',
    name: "Marcus Osei",
    initials: "MO",
    role: "Analyst · Meridian Capital",
  },
  {
    quote:
      '"When Docsy can\'t support a claim, it tells me. That single behavior is why our research team actually trusts it."',
    name: "Sara Kim",
    initials: "SK",
    role: "Lead · Atlas Research",
  },
]

function Testimonials() {
  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-16 lg:py-24">
      <SectionHeading
        className="max-w-160"
        eyebrow="In the field"
        title="The people who can't afford a wrong answer."
      />

      {/* Below `md` the cards become a swipeable rail: each card is 82% of the
          content width, so the next one peeks in by about a quarter. */}
      <div className="no-scrollbar -mx-6 mt-14 flex snap-x snap-mandatory scroll-pl-6 gap-4 overflow-x-auto px-6 md:mx-0 md:grid md:grid-cols-3 md:gap-6 md:overflow-visible md:px-0">
        {TESTIMONIALS.map((testimonial) => (
          <Card
            key={testimonial.name}
            className="w-[82%] shrink-0 snap-start [--card-spacing:--spacing(7)] md:w-auto"
          >
            <CardContent>
              <blockquote className="text-[0.9375rem] leading-relaxed">
                {testimonial.quote}
              </blockquote>
            </CardContent>

            <CardContent className="mt-auto flex items-center gap-3">
              <Avatar>
                <AvatarFallback className="text-xs">
                  {testimonial.initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex min-w-0 flex-col">
                <span className="text-[0.9375rem] font-semibold">
                  {testimonial.name}
                </span>
                <span className="text-sm text-muted-foreground">
                  {testimonial.role}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}

export { Testimonials }

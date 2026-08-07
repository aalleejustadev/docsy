export type BillingPeriod = "monthly" | "annual"

export type PlanFeature = {
  label: string
  /** Renders the feature in bold — for the one line that sells the plan. */
  emphasis?: boolean
}

export type Plan = {
  id: string
  name: string
  description: string
  /** Dollars per month under each billing period. */
  price: Record<BillingPeriod, number>
  cta: { label: string; href: string }
  ctaVariant: "default" | "outline"
  features: PlanFeature[]
  /** Marks the plan as "Most popular" and gives it the brand treatment. */
  highlighted?: boolean
}

/** Shown next to the "Annual" toggle label. */
export const ANNUAL_DISCOUNT = "−20%"

export const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    description: "For trying it on a handful of files.",
    price: { monthly: 0, annual: 0 },
    cta: { label: "Get started", href: "/sign-up" },
    ctaVariant: "outline",
    features: [
      { label: "Up to 5 documents" },
      { label: "5 questions per month" },
      { label: "Cited answers & source reader" },
      { label: "OCR for scanned files" },
    ],
  },
  {
    id: "pro",
    name: "Pro",
    description: "For professionals living in documents.",
    price: { monthly: 19, annual: 15 },
    cta: { label: "Try Docsy free", href: "/sign-up?plan=pro" },
    ctaVariant: "default",
    highlighted: true,
    features: [
      { label: "Everything in Free, plus:" },
      { label: "Unlimited documents" },
      { label: "50 questions per month" },
      { label: "Multi-document search" },
      { label: "Stronger model & API access" },
      { label: "Drive & Notion integrations" },
    ],
  },
  {
    id: "business",
    name: "Business",
    description: "For power users who never want to hit a limit.",
    price: { monthly: 49, annual: 39 },
    cta: { label: "Get Business", href: "/sign-up?plan=business" },
    ctaVariant: "outline",
    features: [
      { label: "Everything in Pro, plus:" },
      { label: "Unlimited questions per month", emphasis: true },
      { label: "Unlimited documents" },
      { label: "Priority support" },
    ],
  },
]

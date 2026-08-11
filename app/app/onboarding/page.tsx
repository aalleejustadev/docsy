import type { Metadata } from "next"

import { CreateOrganizationForm } from "@/components/onboarding/create-organization-form"

export const metadata: Metadata = {
  title: "Name your organization",
}

/** First run — `ui-design/dashboard/light/dashboard-organisation.png`. */
export default function OnboardingPage() {
  return <CreateOrganizationForm />
}

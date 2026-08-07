import { Fragment } from "react"
import Link from "next/link"
import {
  ArrowRightIcon,
  CheckIcon,
  LockIcon,
  ShieldIcon,
  Trash2Icon,
} from "lucide-react"

import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { SectionHeading } from "@/components/marketing/section-heading"

const GUARANTEES = [
  {
    icon: LockIcon,
    title: "Encrypted in transit and at rest",
    description: "AES-256 storage in an isolated, per-workspace vector store.",
  },
  {
    icon: ShieldIcon,
    title: "Never used to train models",
    description: "Your content is yours. We don't train on it — ever.",
  },
  {
    icon: Trash2Icon,
    title: "Delete anything, anytime",
    description:
      "Remove a document or a conversation and its embeddings go with it.",
  },
  {
    icon: CheckIcon,
    title: "SOC 2 & audit-ready",
    description: "Independently audited, with an activity log of every action.",
  },
]

function Privacy() {
  return (
    <section
      id="security"
      className="mx-auto w-full max-w-6xl scroll-mt-16 px-6 py-16 lg:py-24"
    >
      <Card className="grid grid-cols-1 gap-0 p-0 lg:grid-cols-2">
        <div className="p-8 lg:p-12">
          <SectionHeading
            size="sm"
            eyebrow="Privacy by default"
            title="Your documents stay yours."
            description={
              <>
                Trustworthy answers start with trustworthy handling.
                <br />
                Docsy is built so sensitive files never leave your control.
              </>
            }
          />
          <Link
            href="/security"
            className="group mt-8 inline-flex items-center gap-2 text-[0.9375rem] font-medium text-brand"
          >
            Read the security overview
            <ArrowRightIcon className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        <div className="flex flex-col gap-5 border-t bg-surface p-8 lg:border-t-0 lg:border-l lg:p-12">
          {GUARANTEES.map(({ icon: Icon, title, description }, index) => (
            <Fragment key={title}>
              {index > 0 ? <Separator /> : null}
              <div className="flex gap-3">
                <Icon className="mt-0.5 size-4.5 shrink-0 text-brand" />
                <div className="flex flex-col gap-1">
                  <h3 className="text-[0.9375rem] font-semibold">{title}</h3>
                  <p className="text-sm text-muted-foreground">{description}</p>
                </div>
              </div>
            </Fragment>
          ))}
        </div>
      </Card>
    </section>
  )
}

export { Privacy }

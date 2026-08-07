import {
  BookOpenIcon,
  CommandIcon,
  FileIcon,
  LayersIcon,
  MessageSquareIcon,
  Share2Icon,
} from "lucide-react"

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { SectionHeading } from "@/components/marketing/section-heading"

const FEATURES = [
  {
    icon: MessageSquareIcon,
    title: "Chat with citations",
    description:
      "Streaming answers where every claim links to the exact line it's based on. If the source isn't there, Docsy says so.",
  },
  {
    icon: BookOpenIcon,
    title: "Side-by-side source reader",
    description:
      "The passage behind each answer highlighted next to your chat — read it in context without leaving the conversation.",
  },
  {
    icon: LayersIcon,
    title: "Multi-document search",
    description:
      "Ask across your whole library at once. Docsy retrieves from the right files by meaning, not just keywords.",
  },
  {
    icon: FileIcon,
    title: "40+ formats & OCR",
    description:
      "PDFs, Word, slides, spreadsheets, plain text — even scanned documents, read automatically with built-in OCR.",
  },
  {
    icon: CommandIcon,
    title: "⌘K command palette",
    description:
      "Search, ask, or jump anywhere from the keyboard. Chat history, shortcuts, and a workflow built for power users.",
  },
  {
    icon: Share2Icon,
    title: "Export & integrate",
    description:
      "Export any conversation to Markdown or a shareable link. Connect Google Drive and Notion to keep sources in sync.",
  },
]

function EverythingInOneWorkspace() {
  return (
    <section id="product" className="scroll-mt-16 border-y bg-surface">
      <div className="mx-auto w-full max-w-6xl px-6 py-16 lg:py-24">
        <SectionHeading
          className="max-w-160"
          eyebrow="Everything in one workspace"
          title="Built for people who have to be right — and prove it."
        />

        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <Card key={title} className="[--card-spacing:--spacing(6)]">
              <CardHeader className="gap-2">
                <span className="mb-3 flex size-9 items-center justify-center rounded-lg bg-muted text-brand">
                  <Icon className="size-4.5" />
                </span>
                <CardTitle className="text-base font-semibold">
                  {title}
                </CardTitle>
                <CardDescription className="leading-relaxed">
                  {description}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

export { EverythingInOneWorkspace }

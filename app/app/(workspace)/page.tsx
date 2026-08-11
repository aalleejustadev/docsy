import type { Metadata } from "next"
import { PlusIcon, UploadIcon } from "lucide-react"

import { requireSession } from "@/lib/session"

export const metadata: Metadata = {
  title: "Home",
}

function greeting(date = new Date()) {
  const hour = date.getHours()

  if (hour < 12) return "Good morning"
  if (hour < 18) return "Good afternoon"
  return "Good evening"
}

/** Dashboard home — `ui-design/dashboard/light/dashboard-home.png`. */
export default async function AppHomePage() {
  const session = await requireSession()
  const firstName = session.user.name?.trim().split(/\s+/)[0]

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-10">
      <h2 className="font-heading text-3xl font-bold tracking-tight">
        {greeting()}
        {firstName ? `, ${firstName}` : ""}
      </h2>
      <p className="mt-2 text-muted-foreground">
        Ask a question, or pick up where you left off.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <button
          type="button"
          className="flex cursor-pointer items-center gap-4 rounded-xl border bg-card p-4 text-left transition-colors hover:bg-accent/50"
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <PlusIcon className="size-5" />
          </span>
          <span className="flex flex-col">
            <span className="font-semibold">Start a new chat</span>
            <span className="text-sm text-muted-foreground">
              Ask across your library
            </span>
          </span>
        </button>

        <button
          type="button"
          className="flex cursor-pointer items-center gap-4 rounded-xl border border-dashed bg-surface p-4 text-left transition-colors hover:border-brand hover:bg-brand/5"
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand/15 text-brand">
            <UploadIcon className="size-5" />
          </span>
          <span className="flex flex-col">
            <span className="font-semibold">Upload documents</span>
            <span className="text-sm text-muted-foreground">
              PDF, Word, slides, scans
            </span>
          </span>
        </button>
      </div>
    </div>
  )
}

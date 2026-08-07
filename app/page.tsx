import { SiteHeader } from "@/components/site-header"

export default function Page() {
  return (
    <div className="flex min-h-svh flex-col">
      <SiteHeader />
      <main className="flex-1">
        {/* Landing sections (hero, how it works, pricing, …) go here. */}
      </main>
    </div>
  )
}

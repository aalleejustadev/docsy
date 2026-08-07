const STATS = [
  { value: "100%", label: "of answers carry a citation" },
  { value: "40+", label: "file formats supported" },
  { value: "<1.2s", label: "to first streamed token" },
  { value: "12M+", label: "pages indexed for customers" },
]

function Stats() {
  return (
    <section className="border-y bg-surface">
      <dl className="mx-auto grid w-full max-w-6xl grid-cols-2 gap-x-6 gap-y-10 px-6 py-12 md:grid-cols-4">
        {STATS.map((stat) => (
          <div
            key={stat.label}
            className="flex flex-col items-center gap-2 text-center"
          >
            {/* `dt` leads in the DOM so it reads as "label: value", but the
                value is shown first. */}
            <dt className="order-2 text-sm text-muted-foreground">
              {stat.label}
            </dt>
            <dd className="order-1 text-4xl font-bold tracking-tight sm:text-5xl">
              {stat.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

export { Stats }

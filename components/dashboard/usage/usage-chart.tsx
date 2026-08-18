"use client"

import { Bar, BarChart, Cell, XAxis } from "recharts"

import type { UsageDay } from "@/lib/usage"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

const config = {
  questions: { label: "Questions", color: "var(--brand)" },
} satisfies ChartConfig

function dayLabel(date: string) {
  // Parsed as local midnight; `new Date("2026-08-16")` would be UTC and can
  // land on the previous day west of Greenwich.
  const [year, month, day] = date.split("-").map(Number)

  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  })
}

function shortLabel(date: string) {
  const [year, month, day] = date.split("-").map(Number)

  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })
}

/**
 * Questions per day — `ui-design/dashboard/light/usage-page.png`.
 *
 * One series, so no legend: the card's heading already says what's plotted.
 * Today is the last column and is filled solid rather than tinted — emphasis,
 * not a second category, and it's identified by position and by the date under
 * it as well as by the fill.
 *
 * No gridlines and no y-axis, as the reference has none. That puts every exact
 * value in the hover tooltip, so the same numbers are also written out in a
 * screen-reader table below — a chart whose values only exist on hover is one
 * that can't be read without a mouse.
 */
function UsageChart({ days }: { days: UsageDay[] }) {
  const first = days.at(0)
  const last = days.at(-1)
  const busiest = Math.max(...days.map((day) => day.questions))

  return (
    <>
      <ChartContainer
        config={config}
        className="aspect-auto h-52 w-full [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-transparent"
      >
        <BarChart data={days} margin={{ top: 8, right: 0, bottom: 0, left: 0 }}>
          {/* Present for the category scale and the tooltip's label, but not
              drawn: the reference labels only the two ends, below the plot. */}
          <XAxis dataKey="date" hide />

          <ChartTooltip
            cursor={false}
            content={
              <ChartTooltipContent
                labelFormatter={(_, payload) =>
                  dayLabel(String(payload?.[0]?.payload?.date ?? ""))
                }
                formatter={(value) =>
                  `${value} ${value === 1 ? "question" : "questions"}`
                }
              />
            }
          />

          <Bar dataKey="questions" radius={[4, 4, 0, 0]} maxBarSize={56}>
            {days.map((day, index) => (
              <Cell
                key={day.date}
                // Today reads as the live figure; the rest are settled.
                className={
                  index === days.length - 1 ? "fill-brand" : "fill-brand/45"
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ChartContainer>

      <div className="mt-2 flex items-center justify-between font-mono text-xs text-muted-foreground">
        <span>{first ? shortLabel(first.date) : ""}</span>
        <span>{last ? shortLabel(last.date) : ""}</span>
      </div>

      {/* Wrapped rather than `sr-only` on the table itself: a table refuses to
          shrink below its content, so the class left a full-width box in the
          layout — visually clipped, but still dragging the page 172px wider
          on a phone. A div honours the 1px and the table stays inside it. */}
      <div className="sr-only">
        <table>
          <caption>
            Questions asked per day over the last {days.length} days. Busiest
            day: {busiest}.
          </caption>
          <thead>
            <tr>
              <th scope="col">Day</th>
              <th scope="col">Questions</th>
            </tr>
          </thead>
          <tbody>
            {days.map((day) => (
              <tr key={day.date}>
                <th scope="row">{dayLabel(day.date)}</th>
                <td>{day.questions}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

export { UsageChart }

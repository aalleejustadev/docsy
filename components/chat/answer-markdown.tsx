"use client"

import * as React from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

import { Separator } from "@/components/ui/separator"

/**
 * Renders an answer as prose.
 *
 * Claude writes Markdown, so this turns it into real headings, lists and
 * emphasis rather than showing `##` and `**` to the reader.
 */

/** The subset of hast this file walks. */
type HastNode = {
  type: string
  value?: string
  tagName?: string
  properties?: Record<string, unknown>
  children?: HastNode[]
}

/**
 * Turns the `[1]` markers written into the text by the streaming route into
 * real `<sup>` elements.
 *
 * It runs on the parsed tree rather than the raw string so a marker inside a
 * heading, list item or bold run is caught too — and so it can never touch
 * anything that only looks like a marker inside code, which is a separate node.
 */
function rehypeCitations() {
  return (tree: HastNode) => {
    const walk = (node: HastNode) => {
      if (!node.children) return

      // Code keeps its literal text — a `[1]` in a snippet isn't a citation.
      if (node.tagName === "code" || node.tagName === "pre") return

      const next: HastNode[] = []

      for (const child of node.children) {
        if (child.type !== "text" || !child.value?.includes("[")) {
          walk(child)
          next.push(child)
          continue
        }

        for (const part of child.value.split(/(\[\d+\])/g)) {
          if (!part) continue

          if (/^\[\d+\]$/.test(part)) {
            next.push({
              type: "element",
              tagName: "sup",
              properties: { className: ["citation"] },
              children: [{ type: "text", value: part }],
            })
          } else {
            next.push({ type: "text", value: part })
          }
        }
      }

      node.children = next
    }

    walk(tree)

    return tree
  }
}

type MarkdownProps<T extends keyof React.JSX.IntrinsicElements> =
  React.ComponentProps<T> & { node?: unknown }

/**
 * react-markdown hands every override the parsed `node`. Spreading it onto the
 * element would put `node="[object Object]"` in the DOM and draw a React
 * warning for an unknown attribute, so it's dropped on the way through.
 */
function omitNode<T extends { node?: unknown }>(props: T) {
  const rest = { ...props }
  delete rest.node

  return rest
}

/**
 * `first:mt-0` throughout so a block that opens the answer doesn't push itself
 * away from the Docsy label above it.
 */
const components = {
  // Claude is told to start at `##`, but a stray `#` shouldn't outrank the
  // page's own heading, so both land on the same level.
  h1: (props: MarkdownProps<"h1">) => (
    <h2
      className="mt-6 mb-2 text-lg font-bold tracking-tight first:mt-0"
      {...omitNode(props)}
    />
  ),
  h2: (props: MarkdownProps<"h2">) => (
    <h2
      className="mt-6 mb-2 text-lg font-bold tracking-tight first:mt-0"
      {...omitNode(props)}
    />
  ),
  h3: (props: MarkdownProps<"h3">) => (
    <h3 className="mt-5 mb-1.5 font-semibold first:mt-0" {...omitNode(props)} />
  ),
  h4: (props: MarkdownProps<"h4">) => (
    <h4 className="mt-4 mb-1.5 font-semibold first:mt-0" {...omitNode(props)} />
  ),
  p: (props: MarkdownProps<"p">) => (
    <p
      className="my-3 leading-relaxed first:mt-0 last:mb-0"
      {...omitNode(props)}
    />
  ),
  ul: (props: MarkdownProps<"ul">) => (
    <ul
      className="my-3 ml-5 list-disc first:mt-0 last:mb-0"
      {...omitNode(props)}
    />
  ),
  ol: (props: MarkdownProps<"ol">) => (
    <ol
      className="my-3 ml-5 list-decimal first:mt-0 last:mb-0"
      {...omitNode(props)}
    />
  ),
  li: (props: MarkdownProps<"li">) => (
    <li className="mt-1.5 leading-relaxed" {...omitNode(props)} />
  ),
  strong: (props: MarkdownProps<"strong">) => (
    <strong className="font-semibold" {...omitNode(props)} />
  ),
  blockquote: (props: MarkdownProps<"blockquote">) => (
    <blockquote
      className="my-3 border-s-2 ps-4 text-muted-foreground italic"
      {...omitNode(props)}
    />
  ),
  hr: () => <Separator className="my-6" />,
  // Every link opens in a new tab so a click never loses the thread. The
  // `rel` is the safety half of that: `noopener` denies the opened page a
  // handle back onto this one, `noreferrer` withholds the referrer. Both are
  // applied after the spread so a link in an answer can't override them.
  a: (props: MarkdownProps<"a">) => (
    <a
      className="underline underline-offset-4 hover:text-primary"
      {...omitNode(props)}
      target="_blank"
      rel="noreferrer noopener"
    />
  ),
  code: (props: MarkdownProps<"code">) => (
    <code
      className="rounded bg-muted px-1 py-0.5 font-mono text-[0.85em]"
      {...omitNode(props)}
    />
  ),
  pre: (props: MarkdownProps<"pre">) => (
    <pre
      className="my-3 overflow-x-auto rounded-lg bg-muted p-3 text-sm [&_code]:bg-transparent [&_code]:p-0"
      {...omitNode(props)}
    />
  ),
  // Wide tables scroll inside their own container rather than stretching the
  // message column.
  table: (props: MarkdownProps<"table">) => (
    <div className="my-3 overflow-x-auto rounded-lg border">
      <table className="w-full text-sm" {...omitNode(props)} />
    </div>
  ),
  th: (props: MarkdownProps<"th">) => (
    <th
      className="border-b bg-surface px-3 py-2 text-left font-semibold"
      {...omitNode(props)}
    />
  ),
  td: (props: MarkdownProps<"td">) => (
    <td
      className="border-b px-3 py-2 align-top last:border-0"
      {...omitNode(props)}
    />
  ),
  sup: (props: MarkdownProps<"sup">) => (
    <sup
      className="ml-0.5 font-mono text-[0.625rem] font-semibold text-brand"
      {...omitNode(props)}
    />
  ),
}

function AnswerMarkdown({ children }: { children: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeCitations]}
      components={components}
    >
      {children}
    </ReactMarkdown>
  )
}

export { AnswerMarkdown }

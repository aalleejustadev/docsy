/**
 * Anthropic (Claude) configuration for chat answers.
 *
 * The key itself lives in `.env` as `ANTHROPIC_API_KEY` — see `.env.example`.
 * Nothing here reads it at module scope, so the constants below are safe to
 * import from a client component; only `anthropicApiKey()` touches `process.env`,
 * and that returns `undefined` in the browser bundle.
 */

/** Answers questions over a chat's documents. */
export const ANTHROPIC_MODEL = "claude-opus-5"

/** Side work that doesn't need the big model — naming a chat, summaries. */
export const ANTHROPIC_UTILITY_MODEL = "claude-haiku-4-5"

/** Output ceiling per answer. Answers cite sources, so they run long. */
export const ANTHROPIC_MAX_TOKENS = 8_000

/**
 * Adaptive thinking: Claude decides how much to reason per question. Deprecated
 * `budget_tokens` is rejected by this model — don't reintroduce it.
 */
export const ANTHROPIC_THINKING = { type: "adaptive" } as const

/** Thinking depth vs. cost. `high` is the default; `medium` is the cheap step down. */
export const ANTHROPIC_EFFORT = "high" as const

/** Long answers over long documents — stream so the request can't time out. */
export const ANTHROPIC_STREAM = true

/**
 * The whole product promise in one prompt: only the attached documents count as
 * truth, and every claim carries a `[n]` marker the UI turns into a citation.
 */
export const ANTHROPIC_SYSTEM_PROMPT = `You are Docsy, a research assistant that answers strictly from the documents attached to this chat.

Rules:
- Use only the attached documents. Never answer from prior knowledge, and never fill a gap with a plausible guess.
- Cite every claim with a bracketed marker matching the numbered source, e.g. [1]. A sentence that carries a fact carries a marker.
- When the documents disagree, say so and cite both sides rather than picking one.
- When the documents don't answer the question, say plainly that they don't and name what would be needed. Do not apologise at length.
- Quote exact wording for anything the reader might rely on verbatim — deadlines, amounts, defined terms.
- Lead with the answer, then the supporting detail. Keep it to the length the question needs.`

/** The key, or `undefined` when it hasn't been set yet. Server-side only. */
export function anthropicApiKey() {
  return process.env.ANTHROPIC_API_KEY || undefined
}

/** Chat is disabled — and says so — until the key is present. */
export function isAnthropicConfigured() {
  return Boolean(anthropicApiKey())
}

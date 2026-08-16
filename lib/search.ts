import { APP_ROOT } from "@/lib/dashboard-nav"

/**
 * Passage search across the workspace's documents: the URL contract, and the
 * matching itself.
 *
 * The matching runs in the app rather than in Postgres. It is a few hundred
 * kilobytes of text per workspace, and doing it here means one implementation
 * decides what counts as a match, what it scores, and which words get
 * highlighted — with `to_tsvector` those are three different subsystems that
 * have to be kept agreeing. Postgres full-text search is the upgrade path once
 * a workspace's library outgrows a single scan; `searchStems` below is written
 * so the same stems can drive a `tsquery` when that day comes.
 */

export const SEARCH_ROUTE = `${APP_ROOT}/search`

/** Passages per page — five, as `dashboard-search-page.png` shows. */
export const SEARCH_PAGE_SIZE = 5

/** Past this the box is being pasted into, not typed in. */
export const SEARCH_QUERY_MAX = 200

/** Beyond this a query is unfocused enough that more terms don't help. */
const MAX_TERMS = 12

/** A stem this short prefix-matches too much to be useful. */
const MIN_PREFIX_STEM = 4

/**
 * Words carrying no signal. Deliberately short: an aggressive list throws away
 * terms that matter in a contract ("no", "not"), and a passage search is
 * forgiving of a few extra matches in a way a keyword index isn't.
 */
const STOPWORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "by",
  "for",
  "from",
  "in",
  "is",
  "it",
  "of",
  "on",
  "or",
  "that",
  "the",
  "this",
  "to",
  "was",
  "were",
  "with",
])

/**
 * Endings stripped to get from a typed word to something that will prefix-match
 * its relatives — "termination" and "terminated" both need to reach "termin".
 *
 * Longest first, so "ation" wins over "ion" and leaves a usable stem behind.
 */
const SUFFIXES = [
  "ational",
  "iveness",
  "fulness",
  "ization",
  "ations",
  "ration",
  "ement",
  "ation",
  "ities",
  "ively",
  "ingly",
  "ments",
  "ology",
  "ances",
  "ences",
  "ment",
  "ness",
  "tion",
  "sion",
  "ance",
  "ence",
  "able",
  "ible",
  "ing",
  "ies",
  "ive",
  "ity",
  "ers",
  "ed",
  "es",
  "ly",
  "s",
]

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

/**
 * "terminations" → "termin". A crude stemmer, not a correct one: it only has
 * to bring a word and its relatives to a common prefix, and over-stemming
 * costs a few loose matches where under-stemming costs the match entirely.
 */
export function stemWord(word: string) {
  for (const suffix of SUFFIXES) {
    if (
      word.length >= suffix.length + MIN_PREFIX_STEM &&
      word.endsWith(suffix)
    ) {
      return word.slice(0, -suffix.length)
    }
  }

  return word
}

/** One word from the query, and what it will match on. */
export type SearchStem = {
  /** As typed, for the "nothing matched" message. */
  word: string
  stem: string
  /** Long stems match as a word prefix; short ones must match whole words. */
  prefix: boolean
}

/**
 * The query, reduced to the words worth matching on.
 *
 * A query made entirely of stopwords keeps them — someone searching "as is"
 * means it, and returning nothing would look broken.
 */
export function searchStems(query: string): SearchStem[] {
  const words = query
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((word) => word.length > 1)

  const meaningful = words.filter((word) => !STOPWORDS.has(word))
  const chosen = meaningful.length > 0 ? meaningful : words

  const seen = new Set<string>()
  const stems: SearchStem[] = []

  for (const word of chosen) {
    const stem = stemWord(word)
    if (seen.has(stem)) continue

    seen.add(stem)
    stems.push({ word, stem, prefix: stem.length >= MIN_PREFIX_STEM })

    if (stems.length === MAX_TERMS) break
  }

  return stems
}

/**
 * One regular expression for the whole query.
 *
 * The lookarounds are the word boundaries: `\b` treats an accented letter as a
 * boundary, which would match "note" inside "notér". Prefix stems allow
 * trailing letters, so "termin" reaches "terminated" without also reaching
 * "termini-something-very-long".
 */
function matchPattern(stems: SearchStem[]) {
  const alternatives = stems.map(({ stem, prefix }) =>
    prefix ? `${escapeRegExp(stem)}\\p{L}{0,6}` : escapeRegExp(stem)
  )

  return new RegExp(
    `(?<![\\p{L}\\p{N}])(?:${alternatives.join("|")})(?![\\p{L}\\p{N}])`,
    "giu"
  )
}

const MIN_PASSAGE = 180
const MAX_PASSAGE = 700

function chunkSentences(block: string) {
  const chunks: string[] = []
  let current = ""

  for (const sentence of block.split(/(?<=[.!?])\s+/)) {
    if (current && current.length + sentence.length + 1 > MAX_PASSAGE) {
      chunks.push(current)
      current = ""
    }

    current = current ? `${current} ${sentence}` : sentence
  }

  if (current) chunks.push(current)

  return chunks
}

/**
 * Extracted text, cut into the units a result card shows.
 *
 * Paragraphs are the natural seam — `mammoth` separates them with a blank line
 * — but on their own they're the wrong size: a heading is four characters and
 * a recital can run to a page. Short paragraphs are glued to their neighbours
 * until they carry enough context to read alone, and long ones are cut on
 * sentence ends.
 */
export function splitPassages(text: string): string[] {
  const blocks = text
    .split(/\n{2,}/)
    .map((block) => block.replace(/\s+/g, " ").trim())
    .filter(Boolean)

  const passages: string[] = []
  let buffer = ""

  const flush = () => {
    if (buffer) passages.push(buffer)
    buffer = ""
  }

  for (const block of blocks) {
    if (block.length > MAX_PASSAGE) {
      flush()
      passages.push(...chunkSentences(block))
      continue
    }

    buffer = buffer ? `${buffer} ${block}` : block
    if (buffer.length >= MIN_PASSAGE) flush()
  }

  flush()

  return passages
}

type Match = { start: number; end: number; stem: string }

function findMatches(passage: string, stems: SearchStem[]): Match[] {
  const pattern = matchPattern(stems)
  const matches: Match[] = []

  for (const found of passage.matchAll(pattern)) {
    const text = found[0].toLowerCase()
    const stem =
      stems.find(({ stem, prefix }) =>
        prefix ? text.startsWith(stem) : text === stem
      )?.stem ?? text

    matches.push({
      start: found.index,
      end: found.index + found[0].length,
      stem,
    })
  }

  return matches
}

/** How close together the terms have to sit to read as one phrase. */
const WINDOW_CHARS = 120

/**
 * The tightest run of matches, and how much of the query it covers.
 *
 * This is what separates a passage that happens to contain every word from one
 * that contains the phrase — "termination notice" in a sentence beats the two
 * words three paragraphs apart.
 */
function bestWindow(matches: Match[]) {
  let best = { start: matches[0].start, end: matches[0].end, stems: 0 }

  for (let index = 0; index < matches.length; index += 1) {
    const stems = new Set<string>()
    let end = matches[index].end

    for (let ahead = index; ahead < matches.length; ahead += 1) {
      if (matches[ahead].end - matches[index].start > WINDOW_CHARS) break

      stems.add(matches[ahead].stem)
      end = matches[ahead].end
    }

    if (stems.size > best.stems) {
      best = { start: matches[index].start, end, stems: stems.size }
    }
  }

  return best
}

/** A run of the snippet, either highlighted or not. */
export type SearchSegment = { text: string; match: boolean }

export type SearchPassageView = {
  /** Document id and passage index — unique, and stable across a reload. */
  id: string
  documentId: string
  documentName: string
  /** Extension pill, e.g. "DOCX". */
  format: string
  /** Only PDFs carry page numbers; null everywhere else. */
  page: number | null
  /** 0–100. What share of the query this passage actually answers. */
  score: number
  segments: SearchSegment[]
  /** Whether the snippet was cut, so the card can show a leading ellipsis. */
  clippedStart: boolean
  clippedEnd: boolean
}

/** Roughly how much text a card shows on two lines. */
const SNIPPET_CHARS = 260

/** Pulls the window back to a word boundary so snippets don't start mid-word. */
function toWordBoundary(text: string, index: number, direction: -1 | 1) {
  let cursor = index

  while (
    cursor > 0 &&
    cursor < text.length &&
    /[\p{L}\p{N}]/u.test(text[cursor - 1])
  ) {
    cursor += direction
  }

  return Math.min(Math.max(cursor, 0), text.length)
}

/**
 * Scores one passage and cuts a snippet around its best match.
 *
 * Returns null when nothing in the query appears — the caller drops it rather
 * than showing a card with no highlight in it.
 */
export function scorePassage(passage: string, stems: SearchStem[]) {
  const matches = findMatches(passage, stems)
  if (matches.length === 0) return null

  const distinct = new Set(matches.map((match) => match.stem)).size
  const window = bestWindow(matches)

  // Bounded at 1 by construction, so the percentage is an absolute reading —
  // "97%" means this passage nearly answers the whole query, not that it beat
  // whatever else happened to be in the result set.
  const coverage = distinct / stems.length
  const proximity = window.stems / stems.length
  const density = Math.min(1, matches.length / (stems.length * 2))
  const score = 0.6 * coverage + 0.3 * proximity + 0.1 * density

  // Centre the snippet on the best window, then spend what's left of the
  // budget either side of it.
  const spare = Math.max(0, SNIPPET_CHARS - (window.end - window.start))
  const from = toWordBoundary(
    passage,
    Math.max(0, window.start - Math.floor(spare / 2)),
    -1
  )
  const to = toWordBoundary(
    passage,
    Math.min(passage.length, from + SNIPPET_CHARS),
    1
  )

  const segments: SearchSegment[] = []
  let cursor = from

  for (const match of matches) {
    if (match.start < from || match.end > to) continue
    // Overlapping alternatives can't happen, but a zero-length gap can.
    if (match.start > cursor) {
      segments.push({ text: passage.slice(cursor, match.start), match: false })
    }

    segments.push({ text: passage.slice(match.start, match.end), match: true })
    cursor = match.end
  }

  if (cursor < to) {
    segments.push({ text: passage.slice(cursor, to), match: false })
  }

  return {
    score: Math.round(score * 100),
    segments,
    clippedStart: from > 0,
    clippedEnd: to < passage.length,
  }
}

/** One scope chip — "All documents · 42", "DOCX · 6". */
export type SearchScopeView = {
  /** `all`, or an uppercase extension. */
  value: string
  label: string
  /** Documents in scope. */
  count: number
}

export type SearchResultsView = {
  passages: SearchPassageView[]
  /** Matching passages across every page. */
  total: number
  /** Distinct documents those passages came from. */
  documentCount: number
  page: number
  pageCount: number
}

/** Anything unrecognised in `?scope=` searches everything. */
export function toSearchScope(
  value: string | undefined,
  scopes: SearchScopeView[]
) {
  return scopes.some((scope) => scope.value === value) ? value! : "all"
}

/** Builds a search URL, leaving defaults out so the plain route stays clean. */
export function searchHref({
  query = "",
  scope = "all",
  page = 1,
}: {
  query?: string
  scope?: string
  page?: number
} = {}) {
  const params = new URLSearchParams()

  if (query.trim()) params.set("q", query.trim())
  if (scope !== "all") params.set("scope", scope)
  if (page > 1) params.set("page", String(page))

  const search = params.toString()

  return search ? `${SEARCH_ROUTE}?${search}` : SEARCH_ROUTE
}

import getMetadata from './index'
import { Metadata } from './types'

// Cinemas put the name of a festival, series or event in front of or behind a
// title, e.g. "Imagine Film Festival: Donkey Princess" or "Docs: Naza". It is
// not part of the film's title, so TMDB doesn't know the film by it. A label
// that two or more titles at one cinema share is such a name, as opposed to
// the subtitle of a single film ("Mission: Impossible - Fallout").

// ": ", " - ", " – ", " — ", " • ", " > " and "|"
export const DELIMITER = /:\s+|\s+[-–—•>]\s+|\s*\|\s*/

// The delimiters of a title that are not between parentheses: a ": " or " - " in
// "Goodbye Sisters (+ supporting film: Like Friend, Like Deer)" is part of what
// the cinema adds, and does not split the film from a label
export const findDelimiters = (title: string) => {
  const inParentheses = new Array<boolean>(title.length).fill(false)
  const opened: number[] = []

  for (let index = 0; index < title.length; index++) {
    if (title[index] === '(') opened.push(index)
    if (title[index] === ')' && opened.length > 0) {
      // only a pair that is closed counts, and what is inside is inside
      for (let inner = opened.pop() as number; inner <= index; inner++) {
        inParentheses[inner] = true
      }
    }
  }

  return [...title.matchAll(new RegExp(DELIMITER, 'g'))].filter(
    (match) => !inParentheses[match.index ?? 0],
  )
}

// A title cut at its delimiters, without the ones between parentheses
export const splitAtDelimiters = (title: string) => {
  const parts: string[] = []
  let start = 0

  for (const match of findDelimiters(title)) {
    parts.push(title.slice(start, match.index))
    start = (match.index ?? 0) + match[0].length
  }

  return [...parts, title.slice(start)]
}

const labelKey = (label: string) => label.toLowerCase().replace(/\s+/g, '')

const isUsableLabel = (label: string, rest: string) =>
  label.length >= 2 && rest.length >= 2 && !/^\d+$/.test(label)

// "Imagine Film Festival: Donkey Princess" -> label "Imagine Film Festival"
const splitPrefix = (title: string) => {
  const match = findDelimiters(title)[0]
  if (!match) return undefined

  const label = title.slice(0, match.index).trim()
  const rest = title.slice(match.index + match[0].length).trim()

  return isUsableLabel(label, rest) ? { label, rest } : undefined
}

// "Wintertuinfestival - Yugo Goes to America" -> label "Yugo Goes to America"
const splitSuffix = (title: string) => {
  const last = findDelimiters(title).at(-1)
  if (!last) return undefined

  const rest = title.slice(0, last.index).trim()
  const label = title.slice((last.index ?? 0) + last[0].length).trim()

  return isUsableLabel(label, rest) ? { label, rest } : undefined
}

// "Tampopo (Incl. Ramen)" -> label "Incl. Ramen". A year is no label.
const splitParenthesis = (title: string) => {
  const match = /\s*\(([^()]+)\)\s*$/.exec(title)
  if (!match) return undefined

  const label = match[1].trim()
  const rest = title.slice(0, match.index).trim()

  return isUsableLabel(label, rest) ? { label, rest } : undefined
}

type Kind = 'prefix' | 'suffix' | 'parenthesis'

const SPLITS = {
  prefix: splitPrefix,
  suffix: splitSuffix,
  parenthesis: splitParenthesis,
} as const

// Labels that more than one distinct title of one cinema has
const findSharedLabels = (titles: string[]) => {
  const titlesPerLabel = new Map<string, Set<string>>()

  for (const title of new Set(titles)) {
    for (const [kind, split] of Object.entries(SPLITS)) {
      const parts = split(title)
      if (!parts) continue

      const key = `${kind}:${labelKey(parts.label)}`
      titlesPerLabel.set(key, (titlesPerLabel.get(key) ?? new Set()).add(title))
    }
  }

  return new Set(
    [...titlesPerLabel]
      .filter(([, sharedBy]) => sharedBy.size > 1)
      .map(([key]) => key),
  )
}

export type SharedLabel = { kind: Kind; label: string }

// A cinema's own name for its programme is no festival or series, nor a note
const IGNORED_LABEL =
  /^(?:expat cinema(?: ro(?:t)?terdam)?|(?:english|eng) (?:subs|subtitles))$/i

export const isIgnoredLabel = (label: string) => IGNORED_LABEL.test(label)

// What is said about one screening, or one print of the film, not a festival or
// series it is part of: "Q&A", "4K Restoration", "Director's Cut", "25th
// Anniversary", "with introduction", "incl. short". Such a label is a note,
// wherever it stands in the title.
const NOTE_LABEL = new RegExp(
  `^(?:${[
    String.raw`q\s*&\s*a`,
    String.raw`(?:4k|2k|35\s?mm|70\s?mm|16\s?mm)(?:\s+(?:restoration|restored|remaster(?:ed)?|print))?`,
    String.raw`(?:restoration|restored|remaster(?:ed)?|re-?release)`,
    String.raw`(?:(?:director'?s|final|extended|theatrical) cut|uncut)`,
    String.raw`\d+(?:st|nd|rd|th) anniversary`,
    String.raw`(?:with|met|incl\.?|inclusief|including)\s.+`,
    String.raw`intro(?:duction)?(?:\s.+)?`,
    String.raw`inleiding(?:\s.+)?`,
    String.raw`live (?:music|score)(?:\s.+)?`,
    String.raw`(?:3d|imax|dubbed|ondertiteld)`,
    String.raw`\d{1,2}\s?\+`, // an age rating
  ].join('|')})$`,
  'i',
)

export const isNoteLabel = (label: string) => NOTE_LABEL.test(label.trim())

// The title without its shared labels, and the labels that were removed
const splitSharedLabels = (title: string, sharedLabels: Set<string>) => {
  let rest = title
  const labels: SharedLabel[] = []

  // from the end to the start: "Film & Food: Tampopo (Incl. Ramen)"
  for (const kind of ['parenthesis', 'suffix', 'prefix'] as Kind[]) {
    const parts = SPLITS[kind](rest)

    if (parts && sharedLabels.has(`${kind}:${labelKey(parts.label)}`)) {
      rest = parts.rest
      labels.push({ kind, label: parts.label })
    }
  }

  return { title: rest, labels }
}

// The label of a title when what is left without it is `rest`: the part before
// ("Cinema Aperitivo: Cold War") or after ("Cold War - Cinema Aperitivo") it
export const splitOffLabel = (
  title: string,
  rest: string,
): (SharedLabel & { rest: string }) | undefined => {
  for (const kind of ['prefix', 'suffix'] as const) {
    const parts = SPLITS[kind](title)

    if (
      parts &&
      parts.rest.trim().toLowerCase() === rest.trim().toLowerCase()
    ) {
      return { kind, label: parts.label, rest: parts.rest }
    }
  }

  return undefined
}

type ScreeningTitle = { title: string; cinema: string }

export const getSharedLabelKey = ({ cinema, title }: ScreeningTitle) =>
  `${cinema}\u0000${title}`

// For every scraped title with a label that is shared at its cinema: the title
// without the label(s), and the labels. A label counts per cinema, one cinema's
// "Docs: ..." doesn't say anything about another's. Keyed by getSharedLabelKey.
export const getSharedLabelSplits = (screenings: ScreeningTitle[]) => {
  const titlesPerCinema = new Map<string, string[]>()
  for (const { title, cinema } of screenings) {
    titlesPerCinema.set(cinema, [...(titlesPerCinema.get(cinema) ?? []), title])
  }

  const splits = new Map<string, { title: string; labels: SharedLabel[] }>()

  for (const [cinema, titles] of titlesPerCinema) {
    const sharedLabels = findSharedLabels(titles)

    for (const title of new Set(titles)) {
      const split = splitSharedLabels(title, sharedLabels)

      if (split.title !== title) {
        splits.set(getSharedLabelKey({ cinema, title }), split)
      }
    }
  }

  return splits
}

// For every scraped title with a label that is shared at its cinema: the title
// without the label(s).
export const getTitlesWithoutSharedLabels = (screenings: ScreeningTitle[]) => {
  const strippedTitles = new Map<string, Set<string>>()

  for (const [key, { title: stripped }] of getSharedLabelSplits(screenings)) {
    const title = key.slice(key.indexOf('\u0000') + 1)

    strippedTitles.set(
      title,
      (strippedTitles.get(title) ?? new Set()).add(stripped),
    )
  }

  return new Map(
    [...strippedTitles].map(([title, stripped]) => [title, [...stripped]]),
  )
}

// A title that did not match, retried without its shared label. The full title
// has been tried first, so a film such as "Mission: Impossible - Fallout" is
// never changed: only a title that has no match yet can be matched this way.
// The result keeps the query and year of the original lookup, so the
// screenings still find it.
export const resolveWithoutSharedLabels = async (
  metadata: Metadata,
  titlesWithoutLabels: string[],
  directors?: string[],
): Promise<Metadata> => {
  if (
    metadata.match.status === 'matched' ||
    metadata.match.status === 'manual'
  ) {
    return metadata
  }

  for (const title of titlesWithoutLabels) {
    const retry = await getMetadata({ title, year: metadata.year, directors })

    // a manual override of the title without the label counts as a match too
    if (retry.match.status === 'matched' || retry.match.status === 'manual') {
      return {
        ...retry,
        query: metadata.query,
        year: metadata.year,
        match: {
          ...retry.match,
          method:
            retry.match.status === 'manual'
              ? retry.match.method
              : 'shared-label',
          strippedTitle: title,
        },
      }
    }
  }

  return metadata
}

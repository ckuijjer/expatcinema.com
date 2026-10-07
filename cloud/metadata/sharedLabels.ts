import getMetadata from './index'
import { Metadata } from './types'

// Cinemas put the name of a festival, series or event in front of or behind a
// title, e.g. "Imagine Film Festival: Donkey Princess" or "Docs: Naza". It is
// not part of the film's title, so TMDB doesn't know the film by it. A label
// that two or more titles at one cinema share is such a name, as opposed to
// the subtitle of a single film ("Mission: Impossible - Fallout").

// ": ", " - ", " – ", " — ", " • ", " > " and "|"
const DELIMITER = /:\s+|\s+[-–—•>]\s+|\s*\|\s*/

const labelKey = (label: string) => label.toLowerCase().replace(/\s+/g, '')

const isUsableLabel = (label: string, rest: string) =>
  label.length >= 2 && rest.length >= 2 && !/^\d+$/.test(label)

// "Imagine Film Festival: Donkey Princess" -> label "Imagine Film Festival"
const splitPrefix = (title: string) => {
  const match = DELIMITER.exec(title)
  if (!match) return undefined

  const label = title.slice(0, match.index).trim()
  const rest = title.slice(match.index + match[0].length).trim()

  return isUsableLabel(label, rest) ? { label, rest } : undefined
}

// "Wintertuinfestival - Yugo Goes to America" -> label "Yugo Goes to America"
const splitSuffix = (title: string) => {
  const delimiters = [...title.matchAll(new RegExp(DELIMITER, 'g'))]
  const last = delimiters.at(-1)
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

const stripSharedLabels = (title: string, sharedLabels: Set<string>) => {
  let stripped = title

  // from the end to the start: "Film & Food: Tampopo (Incl. Ramen)"
  for (const kind of ['parenthesis', 'suffix', 'prefix'] as Kind[]) {
    const parts = SPLITS[kind](stripped)

    if (parts && sharedLabels.has(`${kind}:${labelKey(parts.label)}`)) {
      stripped = parts.rest
    }
  }

  return stripped
}

type ScreeningTitle = { title: string; cinema: string }

// For every scraped title with a label that is shared at its cinema: the title
// without the label(s). A label counts per cinema, one cinema's
// "Docs: ..." doesn't say anything about another's.
export const getTitlesWithoutSharedLabels = (screenings: ScreeningTitle[]) => {
  const titlesPerCinema = new Map<string, string[]>()
  for (const { title, cinema } of screenings) {
    titlesPerCinema.set(cinema, [...(titlesPerCinema.get(cinema) ?? []), title])
  }

  const strippedTitles = new Map<string, Set<string>>()

  for (const titles of titlesPerCinema.values()) {
    const sharedLabels = findSharedLabels(titles)

    for (const title of new Set(titles)) {
      const stripped = stripSharedLabels(title, sharedLabels)

      if (stripped !== title) {
        strippedTitles.set(
          title,
          (strippedTitles.get(title) ?? new Set()).add(stripped),
        )
      }
    }
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
): Promise<Metadata> => {
  if (
    metadata.match.status === 'matched' ||
    metadata.match.status === 'manual'
  ) {
    return metadata
  }

  for (const title of titlesWithoutLabels) {
    const retry = await getMetadata({ title, year: metadata.year })

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

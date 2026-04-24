import { normalizeMovieTitleForLookup } from './titleResolver'

type ManualTitleOverrideInput = {
  title: string
  year?: number
  tmdbId?: number
  imdbId?: string
  note?: string
  addedAt: string
}

export type ManualTitleOverride = ManualTitleOverrideInput & {
  query: string
}

const rawOverrides: ManualTitleOverrideInput[] = [
  {
    title: 'A Family',
    year: 2024,
    tmdbId: 1359694,
    note: 'Kino returns the wrong release year for A Family; force the 2026 TMDB match.',
    addedAt: '2026-04-24',
  },
  {
    title: 'The Exit 8',
    tmdbId: 1408208,
    note: 'Forum Groningen returns the wrong title for Exit 8; force the correct TMDB match.',
    addedAt: '2026-04-24',
  },
  {
    title: 'Kill Bill: the Whole Bloody Affair',
    year: 2006,
    tmdbId: 414419,
    note: 'Kino returns the release year for Kill Bill: Vol. 1 instead of the correct year for the combined Kill Bill: the Whole Bloody Affair; force the correct TMDB match.',
    addedAt: '2026-04-24',
  },
  {
    title: 'The Great Adventure of Horus Prince of the Sun',
    year: 1968,
    tmdbId: 52686,
    note: 'Kino returns a slightly different title',
    addedAt: '2026-04-24',
  },
  {
    title: 'The Great Adventure of Horus, Prince of the Sun',
    year: 1968,
    tmdbId: 52686,
    note: 'Slachtstraat returns a slightly different title',
    addedAt: '2026-04-24',
  },
]

export const manualTitleOverrides: ManualTitleOverride[] = rawOverrides.map(
  (override) => ({
    ...override,
    query: normalizeMovieTitleForLookup(override.title),
  }),
)

export const getManualTitleOverride = (title: string, year?: number) => {
  const query = normalizeMovieTitleForLookup(title)
  return (
    manualTitleOverrides.find(
      (override) => override.query === query && override.year === year,
    ) ?? manualTitleOverrides.find((override) => override.query === query)
  )
}

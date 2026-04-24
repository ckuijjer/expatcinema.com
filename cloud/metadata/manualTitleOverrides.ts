import { normalizeMovieTitleForLookup } from './titleResolver'

type ManualTitleOverrideInput = {
  title: string
  year?: number
  tmdbId?: number
  imdbId?: string
  note?: string
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
  },
  {
    title: 'The Exit 8',
    tmdbId: 1408208,
    note: 'Forum Groningen returns the wrong title for Exit 8; force the correct TMDB match.',
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

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

const rawOverrides: ManualTitleOverrideInput[] = []

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

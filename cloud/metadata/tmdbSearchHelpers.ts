import { TmdbMovie } from './types'

export type TmdbMovieResult = TmdbMovie & {
  id: number
  [key: string]: unknown
}

export const getTmdbSearchYears = (
  year?: number,
  siblingYearHints: number[] = [],
): Array<number | undefined> => {
  const orderedYears = Array.from(
    new Set(
      [year, ...siblingYearHints].filter(
        (value): value is number => value !== undefined,
      ),
    ),
  )

  return orderedYears.length > 0 ? [...orderedYears, undefined] : [undefined]
}

export const mergeTmdbSearchResults = (
  resultSets: TmdbMovieResult[][],
): TmdbMovieResult[] => {
  const uniqueCandidates = new Map<number, TmdbMovieResult>()

  resultSets.forEach((results) => {
    results.slice(0, 5).forEach((result) => {
      uniqueCandidates.set(result.id, result)
    })
  })

  return Array.from(uniqueCandidates.values())
}

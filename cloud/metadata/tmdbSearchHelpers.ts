import { TmdbMovie } from './types'

export type TmdbMovieResult = TmdbMovie & {
  id: number
  [key: string]: unknown
}

export const getTmdbSearchYears = (year?: number): Array<number | undefined> =>
  year === undefined ? [undefined] : [year, undefined]

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

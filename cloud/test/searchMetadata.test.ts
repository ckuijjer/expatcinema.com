import {
  getTmdbSearchYears,
  mergeTmdbSearchResults,
  type TmdbMovieResult,
} from '../metadata/tmdbSearchHelpers'

describe('searchMetadata TMDB search planning', () => {
  test('tries year-filtered and yearless searches when a year exists', () => {
    expect(getTmdbSearchYears(2026)).toEqual([2026, undefined])
  })

  test('tries only yearless search when no year exists', () => {
    expect(getTmdbSearchYears()).toEqual([undefined])
  })

  test('merges year-filtered and yearless result sets without duplicates', () => {
    const results = mergeTmdbSearchResults([
      [
        { id: 101, title: 'First', releaseDate: '2026-01-01' } as TmdbMovieResult,
        { id: 102, title: 'Second', releaseDate: '2026-01-02' } as TmdbMovieResult,
        { id: 103, title: 'Third', releaseDate: '2026-01-03' } as TmdbMovieResult,
        { id: 104, title: 'Fourth', releaseDate: '2026-01-04' } as TmdbMovieResult,
        { id: 105, title: 'Fifth', releaseDate: '2026-01-05' } as TmdbMovieResult,
        { id: 106, title: 'Ignored', releaseDate: '2026-01-06' } as TmdbMovieResult,
      ],
      [
        { id: 104, title: 'Fourth', releaseDate: '2026-01-04' } as TmdbMovieResult,
        { id: 107, title: 'Seventh', releaseDate: '2025-01-07' } as TmdbMovieResult,
      ],
    ])

    expect(results.map(({ id }) => id)).toEqual([101, 102, 103, 104, 105, 107])
  })
})

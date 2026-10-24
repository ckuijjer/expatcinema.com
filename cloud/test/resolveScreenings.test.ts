import { resolveScreenings } from '../pipeline/resolve'
import { getMetadataLookupKey } from '../metadata/titleResolver'
import type { Metadata } from '../metadata/types'
import { logger } from '../powertools'
import { Screening } from '../types'

const screening = (overrides: Partial<Screening>): Screening => ({
  title: 'Possession',
  year: 1981,
  director: 'Andrzej Żuławski',
  url: 'https://example.com/possession',
  cinema: 'Lantarenvenster',
  date: new Date('2026-12-10T18:00:00Z'),
  ...overrides,
})

const matchedPossession: Metadata = {
  query: 'possession',
  year: 1981,
  createdAt: '2026-10-24T00:00:00.000Z',
  movieId: 'tmdb:21484',
  imdbId: 'tt0082933',
  title: 'Possession',
  originalTitle: 'Possession',
  tmdb: { id: 21484, releaseDate: '1981-05-27' } as Metadata['tmdb'],
  match: { status: 'matched', method: 'tmdb-search', confidence: 1 },
}

const unmatchedCure: Metadata = {
  query: 'unknown film',
  year: undefined,
  createdAt: '2026-10-24T00:00:00.000Z',
  match: { status: 'unmatched', method: 'unmatched' },
}

const metadataLookups = new Map([
  [
    getMetadataLookupKey('Possession', 1981),
    {
      query: 'possession',
      year: 1981,
      rawTitles: new Set(['Possession']),
    },
  ],
  [
    getMetadataLookupKey('Unknown Film'),
    { query: 'unknown film', rawTitles: new Set(['Unknown Film']) },
  ],
])

describe('resolveScreenings', () => {
  const screenings = [
    screening({}),
    screening({
      url: 'https://example.com/unknown',
      title: 'Unknown Film',
      year: undefined,
      director: undefined,
      event: 'Filmcollege',
      notes: ['Q&A'],
    }),
  ]

  const resolved = resolveScreenings(screenings, {
    metadata: [matchedPossession, unmatchedCure],
    metadataLookups,
  })

  test('adds the movieId to a screening and removes the director', () => {
    const possession = resolved.screenings.find(
      ({ title }) => title === 'Possession',
    )

    expect(possession).toEqual({
      title: 'Possession',
      year: 1981,
      url: 'https://example.com/possession',
      cinema: 'Lantarenvenster',
      date: new Date('2026-12-10T18:00:00Z'),
      movieId: 'tmdb:21484',
    })
    expect(possession).not.toHaveProperty('director')
  })

  test('keeps the event and notes, and has no movieId for an unmatched title', () => {
    expect(
      resolved.screenings.find(({ title }) => title === 'Unknown Film'),
    ).toMatchObject({
      event: 'Filmcollege',
      notes: ['Q&A'],
      movieId: undefined,
    })
  })

  test('builds a movie for the matched lookup only', () => {
    expect(resolved.movies.map(({ movieId }) => movieId)).toEqual([
      'tmdb:21484',
    ])
  })

  test('has a record for every lookup, with the titles of the cinemas', () => {
    expect(resolved.titleMatches).toEqual([
      expect.objectContaining({
        query: 'possession',
        titleRaw: 'Possession',
        titleRawVariants: ['Possession'],
        movieId: 'tmdb:21484',
        tmdbId: 21484,
      }),
      expect.objectContaining({
        query: 'unknown film',
        titleRaw: 'Unknown Film',
        movieId: undefined,
      }),
    ])
  })

  test('lists what to review', () => {
    expect(resolved.review.unmatched.map(({ query }) => query)).toEqual([
      'unknown film',
    ])
    expect(resolved.review.ambiguous).toEqual([])
    expect(resolved.review.directorDisagreements).toEqual([])
  })

  test('lists a match whose director disagrees', () => {
    const disagreeing = {
      ...matchedPossession,
      match: { ...matchedPossession.match, directorMatch: 'disagree' as const },
    }

    expect(
      resolveScreenings(screenings, {
        metadata: [disagreeing],
        metadataLookups,
      }).review.directorDisagreements.map(({ movieId }) => movieId),
    ).toEqual(['tmdb:21484'])
  })

  test('gives movies that share a slug a unique one, with a warning', () => {
    const warn = jest.spyOn(logger, 'warn').mockImplementation()
    const imago = (tmdbId: number, year: number, releaseDate: string) =>
      ({
        query: 'imago',
        year,
        createdAt: '2026-10-24T00:00:00.000Z',
        movieId: `tmdb:${tmdbId}`,
        title: 'Imago',
        tmdb: { id: tmdbId, releaseDate },
        match: { status: 'matched', method: 'tmdb-search', confidence: 1 },
      }) as Metadata

    const { movies } = resolveScreenings([], {
      metadata: [
        imago(1119539, 2025, '2025-10-22'),
        imago(1722186, 2026, '2026-03-01'),
      ],
      metadataLookups: new Map(),
    })

    expect(movies.map(({ slug }) => slug)).toEqual(['imago', 'imago-2026'])
    expect(warn).toHaveBeenCalledTimes(1)
    expect(warn).toHaveBeenCalledWith(
      'movies share a slug',
      expect.objectContaining({
        slug: 'imago',
        movies: [
          expect.objectContaining({ movieId: 'tmdb:1119539' }),
          expect.objectContaining({ movieId: 'tmdb:1722186' }),
        ],
      }),
    )
    warn.mockRestore()
  })
})

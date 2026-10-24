import { resolveMetadata } from '../metadata/resolveMetadata'
import { getMetadataLookupKey } from '../metadata/titleResolver'
import type { Metadata } from '../metadata/types'
import { rematch } from '../pipeline/rematch'
import { Screening } from '../types'

jest.mock('../metadata/resolveMetadata', () => ({ resolveMetadata: jest.fn() }))

const screening = (overrides: Partial<Screening>): Screening => ({
  title: 'Cure',
  year: 1997,
  director: 'Kiyoshi Kurosawa',
  url: 'https://example.com/cure',
  cinema: 'Lab111',
  date: new Date('2026-10-31T17:40:00Z'),
  ...overrides,
})

describe('rematch', () => {
  const metadata: Metadata = {
    query: 'cure',
    year: 1997,
    createdAt: '2026-10-24T00:00:00.000Z',
    movieId: 'tmdb:36095',
    title: 'Cure',
    tmdb: { id: 36095 } as Metadata['tmdb'],
    match: { status: 'matched', method: 'tmdb-search' },
  }

  beforeEach(() => {
    ;(resolveMetadata as jest.Mock).mockResolvedValue({
      metadataLookups: new Map([
        [
          getMetadataLookupKey('Cure', 1997),
          { query: 'cure', year: 1997, rawTitles: new Set(['Cure']) },
        ],
      ]),
      metadata: [metadata],
    })
  })

  test('matches the screenings, and resolves them like the pipeline does', async () => {
    const result = await rematch([screening({}), screening({})])

    expect(result.screenings).toEqual([
      {
        title: 'Cure',
        year: 1997,
        url: 'https://example.com/cure',
        cinema: 'Lab111',
        date: new Date('2026-10-31T17:40:00Z'),
        movieId: 'tmdb:36095',
      },
    ])
    expect(result.movies.map(({ movieId }) => movieId)).toEqual(['tmdb:36095'])
    expect(result.titleMatches).toHaveLength(1)
  })

  test('gives the matching the director of the screenings, and whether to use it', async () => {
    await rematch([screening({})], { useDirectors: false })

    expect(resolveMetadata).toHaveBeenCalledWith(
      [expect.objectContaining({ director: 'Kiyoshi Kurosawa' })],
      { useDirectors: false },
    )
  })
})

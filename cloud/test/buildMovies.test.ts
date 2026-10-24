import { buildMovies } from '../metadata/buildMovies'
import type { Metadata } from '../metadata/types'

const lookup = (overrides: Partial<Metadata>): Metadata => ({
  query: 'possession',
  year: 1981,
  createdAt: '2026-10-24T00:00:00.000Z',
  match: { status: 'matched', method: 'tmdb-search' },
  ...overrides,
})

describe('buildMovies', () => {
  test('builds a movie with a slug and a sort title', () => {
    const [movie] = buildMovies([
      lookup({
        movieId: 'tmdb:21484',
        imdbId: 'tt0082933',
        title: 'Possession',
        originalTitle: 'Possession',
        tmdb: {
          id: 21484,
          releaseDate: '1981-05-27',
          runtime: 124,
          directors: ['Andrzej Żuławski'],
        } as Metadata['tmdb'],
      }),
    ])

    expect(movie).toMatchObject({
      movieId: 'tmdb:21484',
      slug: 'possession',
      tmdbId: 21484,
      imdbId: 'tt0082933',
      title: 'Possession',
      sortTitle: 'Possession',
      tmdb: {
        id: 21484,
        title: 'Possession',
        releaseDate: '1981-05-27',
        runtime: 124,
        genres: [],
        directors: ['Andrzej Żuławski'],
      },
    })
  })

  test('has one movie per movieId, the last lookup wins', () => {
    const movies = buildMovies([
      lookup({
        movieId: 'tmdb:1',
        title: 'First',
        tmdb: { id: 1 } as Metadata['tmdb'],
      }),
      lookup({
        movieId: 'tmdb:1',
        title: 'Second',
        tmdb: { id: 1 } as Metadata['tmdb'],
      }),
    ])

    expect(movies.map(({ title }) => title)).toEqual(['Second'])
  })

  test('leaves out lookups without a TMDB movie', () => {
    expect(
      buildMovies([
        lookup({ match: { status: 'unmatched', method: 'unmatched' } }),
      ]),
    ).toEqual([])
  })

  test('falls back on the title of the cinemas for a slug', () => {
    const [movie] = buildMovies([
      lookup({
        movieId: 'tmdb:656908',
        query: 'ramayana',
        title: 'रामायण',
        tmdb: { id: 656908 } as Metadata['tmdb'],
      }),
    ])

    expect(movie.slug).toBe('ramayana')
  })
})

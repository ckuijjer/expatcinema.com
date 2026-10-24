import { buildMovies, makeSlugsUnique } from '../metadata/buildMovies'
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

describe('makeSlugsUnique', () => {
  const imago = (tmdbId: number, releaseDate?: string) =>
    lookup({
      query: 'imago',
      year: undefined,
      movieId: `tmdb:${tmdbId}`,
      title: 'Imago',
      tmdb: { id: tmdbId, releaseDate } as Metadata['tmdb'],
    })

  test('leaves movies with a different slug as they are', () => {
    const movies = buildMovies([
      lookup({
        movieId: 'tmdb:1',
        title: 'Possession',
        tmdb: { id: 1 } as Metadata['tmdb'],
      }),
      lookup({
        movieId: 'tmdb:2',
        title: 'Cure',
        tmdb: { id: 2 } as Metadata['tmdb'],
      }),
    ])

    expect(makeSlugsUnique(movies)).toEqual({ movies, clashes: [] })
  })

  test('keeps the slug for the lowest TMDB id, whatever the order, and gives the others their release year', () => {
    const { movies, clashes } = makeSlugsUnique(
      buildMovies([imago(1722186, '2026-03-01'), imago(1119539, '2025-10-22')]),
    )

    expect(movies.map(({ movieId, slug }) => [movieId, slug])).toEqual([
      ['tmdb:1722186', 'imago-2026'],
      ['tmdb:1119539', 'imago'],
    ])
    expect(clashes).toEqual([
      {
        slug: 'imago',
        movies: [
          {
            movieId: 'tmdb:1119539',
            title: 'Imago',
            releaseDate: '2025-10-22',
          },
          {
            movieId: 'tmdb:1722186',
            title: 'Imago',
            releaseDate: '2026-03-01',
          },
        ],
      },
    ])
  })

  test('uses the TMDB id when there is no release year, or it is taken as well', () => {
    const { movies } = makeSlugsUnique(
      buildMovies([
        imago(1, '2025-01-01'),
        imago(2, '2026-01-01'),
        imago(3, '2026-06-01'),
        imago(4),
      ]),
    )

    expect(movies.map(({ slug }) => slug)).toEqual([
      'imago',
      'imago-2026',
      'imago-3',
      'imago-4',
    ])
  })
})

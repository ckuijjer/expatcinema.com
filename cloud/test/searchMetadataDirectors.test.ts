import searchMetadata from '../metadata/searchMetadata'

// A TMDB with a few films, a few people and what they directed
type Film = {
  id: number
  title: string
  originalTitle?: string
  releaseDate: string
  popularity?: number
  directors: string[]
  // too many films have this title for the search to give this one
  notInSearch?: boolean
}

const films: Film[] = [
  {
    id: 1,
    title: 'Hen',
    releaseDate: '2025-03-01',
    popularity: 20,
    directors: ['Nico Scheepers'],
  },
  {
    id: 2,
    title: 'Hen',
    releaseDate: '2026-02-01',
    popularity: 5,
    directors: ['György Pálfi'],
  },
  {
    id: 3,
    title: 'The Rocky Horror Picture Show',
    releaseDate: '1975-08-14',
    directors: ['Jim Sharman'],
  },
  {
    id: 4,
    title: 'Shock Treatment',
    releaseDate: '1981-10-01',
    directors: ['Jim Sharman'],
  },
  {
    id: 5,
    title: 'Love',
    releaseDate: '1971-01-01',
    directors: ['Károly Makk'],
    notInSearch: true,
  },
]

const people = [
  { id: 100, name: 'Jim Sharman', knownForDepartment: 'Directing' },
  { id: 101, name: 'Károly Makk', knownForDepartment: 'Directing' },
]

const toResult = ({ directors, notInSearch, ...film }: Film) => film

const mockGet = jest.fn(
  async (path: string, options?: { searchParams?: { query?: string } }) => {
    const query = options?.searchParams?.query?.toLowerCase()

    if (path === 'search/movie') {
      // the search finds films by their title only, "Love" has too many films
      // for the right one to be among the first
      return {
        results: films
          .filter(
            (film) => !film.notInSearch && film.title.toLowerCase() === query,
          )
          .map(toResult),
      }
    }

    if (path === 'search/person') {
      return {
        results: people.filter(
          (person) =>
            person.name
              .normalize('NFD')
              .replace(/\p{Diacritic}/gu, '')
              .toLowerCase() === query,
        ),
      }
    }

    const personCredits = path.match(/^person\/(\d+)\/movie_credits$/)
    if (personCredits) {
      const name = people.find(
        ({ id }) => id === Number(personCredits[1]),
      )?.name
      return {
        crew: films
          .filter((film) => film.directors.includes(name ?? ''))
          .map((film) => ({ ...toResult(film), job: 'Director' })),
      }
    }

    const credits = path.match(/^movie\/(\d+)\/credits$/)
    if (credits) {
      const film = films.find(({ id }) => id === Number(credits[1]))
      return {
        crew: (film?.directors ?? []).map((name) => ({
          job: 'Director',
          name,
        })),
      }
    }

    const movie = path.match(/^movie\/(\d+)$/)
    if (movie) {
      const film = films.find(({ id }) => id === Number(movie[1]))!
      return {
        ...toResult(film),
        credits: {
          crew: film.directors.map((name) => ({ job: 'Director', name })),
        },
      }
    }

    return {}
  },
)

jest.mock('../clients/tmdb', () => ({
  __esModule: true,
  default: () => ({ get: (...args: unknown[]) => (mockGet as any)(...args) }),
}))

beforeAll(() => {
  process.env.TMDB_API_KEY = 'test'
})

describe('searchMetadata with the director of the screenings', () => {
  test('without a director the more popular film of the title wins', async () => {
    const result = await searchMetadata('Hen', 2025)

    expect(result.movieId).toBe('tmdb:1')
  })

  test('the film of the director wins from the film that is more popular', async () => {
    const result = await searchMetadata('Hen', 2025, [], ['György Pálfi'])

    expect(result.movieId).toBe('tmdb:2')
    expect(result.match.status).toBe('matched')
    expect(result.match.directorMatch).toBe('agree')
  })

  test('another director than the films have changes nothing, but is told', async () => {
    const result = await searchMetadata('Hen', 2025, [], ['Someone Else'])

    expect(result.movieId).toBe('tmdb:1')
    expect(result.match.directorMatch).toBe('disagree')
  })

  test('a title the search does not find is found by the films of the director', async () => {
    const withoutDirector = await searchMetadata('Love', 1971)
    const result = await searchMetadata('Love', 1971, [], ['Károly Makk'])

    expect(withoutDirector.match.status).toBe('unmatched')
    expect(result.movieId).toBe('tmdb:5')
    expect(result.match.method).toBe('director')
  })

  test('a title that comes close to none is found by the year of the only film', async () => {
    const result = await searchMetadata(
      'Cult Night > Rocky Horror',
      1975,
      [],
      ['Jim Sharman'],
    )

    expect(result.movieId).toBe('tmdb:3')
    expect(result.match.method).toBe('director-year')
  })

  test('a year with more than one film of the director is not guessed', async () => {
    const result = await searchMetadata(
      'Rocky Horror Shock',
      undefined,
      [],
      ['Jim Sharman'],
    )

    expect(result.match.status).not.toBe('matched')
  })
})

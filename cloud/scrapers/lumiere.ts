import got from 'got'
import { DateTime } from 'luxon'

import { logger as parentLogger } from '../powertools'
import { Screening } from '../types'
import { runIfMain } from './utils/runIfMain'

const logger = parentLogger.createChild({
  persistentLogAttributes: {
    scraper: 'lumiere',
  },
})

// lumiere.nl is a Next.js front end on a WordPress backend with WPGraphQL.
// Every movie has its Ticketworks performances, and each performance has tags
// such as "engels ondertiteld". Movies exist once per language (NL and EN),
// sharing the same performance ids.
const GRAPHQL_URL = 'https://backend.lumiere.nl/wp/graphql'

const MOVIES_QUERY = `
  query Movies($after: String) {
    movies(first: 100, after: $after) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        title
        link
        language {
          code
        }
        eventData {
          year
          director
        }
        performances {
          id
          startAt
          status
          tags
        }
      }
    }
  }
`

type LumierePerformance = {
  id: string
  startAt: string // local time, e.g. "2026-10-09 20:20:00"
  status: string
  tags: string[] | null
}

type LumiereMovie = {
  title: string
  link: string
  language: { code: string } | null
  eventData: { year: number | null; director: string | null } | null
  performances: LumierePerformance[] | null
}

type MoviesResponse = {
  data: {
    movies: {
      pageInfo: { hasNextPage: boolean; endCursor: string }
      nodes: LumiereMovie[]
    }
  }
}

const fetchAllMovies = async () => {
  const movies: LumiereMovie[] = []
  let after: string | undefined

  // Guard against a pagination bug turning into an endless loop
  for (let page = 0; page < 20; page++) {
    const response = await got
      .post(GRAPHQL_URL, {
        json: { query: MOVIES_QUERY, variables: { after } },
      })
      .json<MoviesResponse>()

    const { pageInfo, nodes } = response.data.movies
    movies.push(...nodes)

    if (!pageInfo.hasNextPage) return movies
    after = pageInfo.endCursor
  }

  logger.warn('stopped paginating movies after 20 pages')
  return movies
}

// Lumière also sells non-film events through the same system (e.g. "The
// Lumière Film Pub Quiz", with year 1900 and no director). Every film has a
// director, so use that to tell them apart.
const isFilm = (movie: LumiereMovie) =>
  Boolean(movie.eventData?.director?.trim())

const hasEnglishSubtitles = ({ tags }: LumierePerformance) =>
  (tags ?? []).some((tag) => /engels ondertiteld|english subtitles/i.test(tag))

const extractFromMainPage = async (): Promise<Screening[]> => {
  const movies = await fetchAllMovies()

  // A performance appears once per language version of its movie; keep one,
  // preferring the English version for the title and link.
  const performances = new Map<
    string,
    { movie: LumiereMovie; performance: LumierePerformance }
  >()

  for (const movie of movies) {
    if (!isFilm(movie)) continue

    for (const performance of movie.performances ?? []) {
      if (!hasEnglishSubtitles(performance)) continue
      if (performance.status === 'CANCELLED') continue

      const existing = performances.get(performance.id)
      if (!existing || movie.language?.code === 'EN') {
        performances.set(performance.id, { movie, performance })
      }
    }
  }

  const screenings: Screening[] = [...performances.values()].map(
    ({ movie, performance }) => ({
      title: movie.title,
      year: movie.eventData?.year ?? undefined,
      url: movie.link,
      cinema: 'Lumière',
      date: DateTime.fromFormat(performance.startAt, 'yyyy-MM-dd HH:mm:ss', {
        zone: 'Europe/Amsterdam',
      }).toJSDate(),
    }),
  )

  logger.debug('screenings', { screenings })

  return screenings
}

runIfMain(extractFromMainPage, import.meta.url)

export default extractFromMainPage

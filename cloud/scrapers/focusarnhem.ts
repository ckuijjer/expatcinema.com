import got from 'got'
import { DateTime } from 'luxon'

import { logger as parentLogger } from '../powertools'
import { Screening } from '../types'
import { runIfMain } from './utils/runIfMain'
import { titleCase } from './utils/titleCase'

const logger = parentLogger.createChild({
  persistentLogAttributes: {
    scraper: 'focusarnhem',
  },
})

// focusarnhem.nl is a Next.js front end on a WordPress backend with
// WPGraphQL (the same setup as lumiere.nl, but selling tickets through
// Ticketlab). Focus lists its English-subtitled screenings (Expat Cinema,
// Wednesdays) as separate movies titled "English subs: <film>", each with
// its own performances. Movies exist once per language (NL and EN), sharing
// the same performance ids.
const GRAPHQL_URL = 'https://backend.focusarnhem.nl/wp/graphql'

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
        performances {
          id
          startAt
          status
          tags {
            name
          }
        }
      }
    }
  }
`

type FocusPerformance = {
  id: string
  startAt: string // local time, e.g. "202610071900"
  status: string
  tags: { name: string }[] | null
}

type FocusMovie = {
  title: string | null
  link: string
  language: { code: string } | null
  performances: FocusPerformance[] | null
}

type MoviesResponse = {
  data: {
    movies: {
      pageInfo: { hasNextPage: boolean; endCursor: string }
      nodes: FocusMovie[]
    }
  }
}

const fetchAllMovies = async () => {
  const movies: FocusMovie[] = []
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

const ENGLISH_SUBS_TITLE_PREFIX = /^(english subs|expat cinema):\s*/i

// Not used by Focus today, but accept a per-screening tag too, as Lumière does
const hasEnglishSubtitlesTag = ({ tags }: FocusPerformance) =>
  (tags ?? []).some(({ name }) =>
    /engels ondertiteld|english subtitles|english subs/i.test(name),
  )

const extractFromMainPage = async (): Promise<Screening[]> => {
  const movies = await fetchAllMovies()

  // A performance appears once per language version of its movie; keep one,
  // preferring the English version for the link.
  const performances = new Map<
    string,
    { movie: FocusMovie; performance: FocusPerformance }
  >()

  for (const movie of movies) {
    const titleMarksEnglish = ENGLISH_SUBS_TITLE_PREFIX.test(movie.title ?? '')

    for (const performance of movie.performances ?? []) {
      if (!titleMarksEnglish && !hasEnglishSubtitlesTag(performance)) continue
      if (performance.status === 'CANCELLED') continue

      const existing = performances.get(performance.id)
      if (!existing || movie.language?.code === 'EN') {
        performances.set(performance.id, { movie, performance })
      }
    }
  }

  const screenings: Screening[] = [...performances.values()].map(
    ({ movie, performance }) => ({
      title: titleCase(
        (movie.title ?? '').replace(ENGLISH_SUBS_TITLE_PREFIX, '').trim(),
      ),
      // No year: Focus's eventData.year looks like the Dutch release year
      // (2026 for Palestine 36 and Downtown, both 2025 films)
      url: movie.link,
      cinema: 'Focus Arnhem',
      date: DateTime.fromFormat(performance.startAt, 'yyyyMMddHHmm', {
        zone: 'Europe/Amsterdam',
      }).toJSDate(),
    }),
  )

  logger.debug('screenings', { screenings })

  return screenings
}

runIfMain(extractFromMainPage, import.meta.url)

export default extractFromMainPage

import got from 'got'
import { decode } from 'html-entities'
import { DateTime } from 'luxon'
import Xray from 'x-ray'

import { logger as parentLogger } from '../powertools'
import { Screening } from '../types'
import { makeScreeningsUniqueAndSorted } from './utils/makeScreeningsUniqueAndSorted'
import { removeYearSuffix } from './utils/removeYearSuffix'
import { runIfMain } from './utils/runIfMain'
import { trim } from './utils/xrayFilters'

const logger = parentLogger.createChild({
  persistentLogAttributes: {
    scraper: 'sliekerfilm',
  },
})

const CURRENT_MOVIES_URL =
  'https://sliekerfilm.nl/wp-json/wp/v2/wp_theatre_prod?per_page=100&_fields=id,link,title'

const MOVIE_API_URL = (id: number) =>
  `https://sliekerfilm.nl/wp-json/lvc/v1/movie/${id}`
const EVENT_API_URL = (id: number) =>
  `https://sliekerfilm.nl/wp-json/lvc/v1/movie_event/${id}`

const xray = Xray({
  filters: {
    trim,
    normalizeWhitespace: (value) =>
      typeof value === 'string' ? value.replace(/\s+/g, ' ') : value,
  },
})
  .concurrency(10)
  .throttle(10, 300)

type ProductionSummary = {
  id: number
  link: string
  title: {
    rendered: string
  }
}

type MovieApiResult = {
  id: number
  title: string
  year?: string
  permalink: string
  status: string
  events: number[]
}

type EventApiResult = {
  date: {
    meta: string
  }
}

type MovieDetailPage = {
  metadata: {
    label: string
    value: string
  }[]
}

const cleanTitle = (title: string) => removeYearSuffix(decode(title)).trim()

const parseReleaseYear = (year?: string) => {
  const parsed = Number(year)

  return Number.isInteger(parsed) ? parsed : undefined
}

const parseScreeningDate = (value: string) => {
  const parsed = DateTime.fromFormat(value, 'yyyy-MM-dd HH:mm', {
    zone: 'Europe/Amsterdam',
  })

  if (!parsed.isValid) {
    throw new Error(`Could not parse Slieker Film screening date: ${value}`)
  }

  return parsed.toJSDate()
}

const hasEnglishSubtitles = ({ metadata }: MovieDetailPage) => {
  const metadataMap = Object.fromEntries(
    metadata.map(({ label, value }) => [label, value]),
  )

  const subtitles = metadataMap['Ondertiteling']?.toLowerCase() ?? ''

  return subtitles.includes('engels') || subtitles.includes('english')
}

const extractFromMoviePage = async ({
  id,
  link,
  title,
}: ProductionSummary): Promise<Screening[]> => {
  const [movie, detailPage] = await Promise.all([
    got(MOVIE_API_URL(id)).json<MovieApiResult>(),
    xray(link, {
      metadata: xray('.movie__property', [
        {
          label: 'p | normalizeWhitespace | trim',
          value: 'strong | normalizeWhitespace | trim',
        },
      ]),
    }) as unknown as Promise<MovieDetailPage>,
  ])

  logger.info('movie page', { id, link, movie, detailPage })

  if (movie.status !== 'available' || !hasEnglishSubtitles(detailPage)) {
    return []
  }

  const events = await Promise.all(
    (movie.events ?? []).map((eventId) =>
      got(EVENT_API_URL(eventId)).json<EventApiResult>(),
    ),
  )

  const screenings = events
    .map(({ date }) => ({
      title: cleanTitle(movie.title || title.rendered),
      year: parseReleaseYear(movie.year),
      url: movie.permalink || link,
      cinema: 'Slieker Film',
      date: parseScreeningDate(date.meta),
    }))
    .filter(({ date }) => date >= DateTime.now().minus({ hours: 1 }).toJSDate())

  logger.info('screenings found for movie', { id, link, screenings })

  return screenings
}

const extractFromMainPage = async (): Promise<Screening[]> => {
  const movies = await got(CURRENT_MOVIES_URL).json<ProductionSummary[]>()

  logger.info('main page', { count: movies.length, movies })

  const screenings = (
    await Promise.all(
      movies
        .filter(({ id, link }) => Number.isInteger(id) && Boolean(link))
        .map(extractFromMoviePage),
    )
  ).flat()

  logger.info('screenings found', { count: screenings.length, screenings })

  return makeScreeningsUniqueAndSorted(screenings)
}

runIfMain(extractFromMainPage, import.meta.url)

export default extractFromMainPage

import { DateTime } from 'luxon'
import Xray from 'x-ray'

import { logger as parentLogger } from '../powertools'
import { Screening } from '../types'
import { makeScreeningsUniqueAndSorted } from './utils/makeScreeningsUniqueAndSorted'
import { runIfMain } from './utils/runIfMain'
import { titleCase } from './utils/titleCase'
import { trim } from './utils/xrayFilters'

const logger = parentLogger.createChild({
  persistentLogAttributes: {
    scraper: 'cinemadevlugt',
  },
})

const xray = Xray({
  filters: {
    trim,
    cleanTitle: (value) =>
      typeof value === 'string' ? titleCase(value.trim()) : value,
    normalizeWhitespace: (value) =>
      typeof value === 'string' ? value.replace(/\s+/g, ' ') : value,
  },
})
  .concurrency(10)
  .throttle(10, 300)

type XRayFromMainPage = {
  title: string
  url: string
}

type XRayFromMoviePage = {
  screenings: {
    date: string
    time: string
  }[]
}

const parseScreeningDate = (date: string, time: string): Date => {
  const normalizedDate = date.match(/\d{2}-\d{2}-\d{4}/)?.[0]

  if (!normalizedDate) {
    throw new Error(`Could not extract Cinema de Vlugt date: ${date}`)
  }

  const parsed = DateTime.fromFormat(
    `${normalizedDate} ${time}`,
    'dd-MM-yyyy HH:mm',
    {
      zone: 'Europe/Amsterdam',
    },
  )

  if (!parsed.isValid) {
    throw new Error(
      `Could not parse Cinema de Vlugt screening date: ${date} ${time}`,
    )
  }

  return parsed.toJSDate()
}

const extractFromMoviePage = async ({
  title,
  url,
}: XRayFromMainPage): Promise<Screening[]> => {
  const movie: XRayFromMoviePage = await xray(url, {
    screenings: xray('ul#tickets li.desktop1', [
      {
        date: 'p.date | normalizeWhitespace | trim',
        time: 'p.time | normalizeWhitespace | trim',
      },
    ]),
  })

  logger.info('extractFromMoviePage', { url, movie })

  return makeScreeningsUniqueAndSorted(
    (movie.screenings ?? []).map(({ date, time }) => ({
      title,
      url,
      cinema: 'Cinema de Vlugt',
      date: parseScreeningDate(date, time),
    })),
  )
}

const extractFromMainPage = async (): Promise<Screening[]> => {
  const movies: XRayFromMainPage[] = await xray(
    'https://www.cinemadevlugt.nl/expat-cinema/',
    'article.movielist-archive',
    [
      {
        title: 'h2.mov-title a | normalizeWhitespace | cleanTitle | trim',
        url: 'h2.mov-title a@href',
      },
    ],
  )

  logger.info('main page', { movies })

  const screenings = (await Promise.all(movies.map(extractFromMoviePage))).flat()

  logger.info('screenings found', { count: screenings.length, screenings })

  return screenings
}

runIfMain(extractFromMainPage, import.meta.url)

export default extractFromMainPage

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
    scraper: 'heerenstraattheater',
  },
})

const BASE_URL = 'https://www.heerenstraattheater.nl'

const xray = Xray({
  filters: {
    trim,
    normalizeWhitespace: (value) =>
      typeof value === 'string' ? value.replace(/\s+/g, ' ') : value,
  },
})
  .concurrency(10)
  .throttle(10, 300)

type MainPageResult = {
  title: string
  url: string
}

type MoviePageResult = {
  timestamps: string[]
}

const cleanTitle = (title: string) =>
  titleCase(title.replace(/\s+ENG SUB$/i, ''))

const parseTimestamp = (timestamp: string) => {
  const parsed = DateTime.fromSeconds(Number(timestamp), {
    zone: 'Europe/Amsterdam',
  })

  if (!parsed.isValid) {
    throw new Error(`Could not parse Heerenstraat timestamp: ${timestamp}`)
  }

  return parsed.toJSDate()
}

const extractFromMoviePage = async ({
  title,
  url,
}: MainPageResult): Promise<Screening[]> => {
  const movie: MoviePageResult = await xray(url, {
    timestamps: ['a.ticketstrigger@data-timestamp'],
  })

  logger.info('movie page', { url, movie })

  return makeScreeningsUniqueAndSorted(
    (movie.timestamps ?? []).map((timestamp) => ({
      title: cleanTitle(title),
      url,
      cinema: 'Heerenstraat Theater',
      date: parseTimestamp(timestamp),
    })),
  )
}

const extractFromMainPage = async (): Promise<Screening[]> => {
  const results: MainPageResult[] = await xray(
    `${BASE_URL}/subtitlesunday`,
    '.overzichtfilms .movie-item-img a.movieimg',
    [
      {
        title: '.hoverinfo .hovertitle | normalizeWhitespace | trim',
        url: '@href',
      },
    ],
  )

  logger.info('main page', { results })

  const screenings = (await Promise.all(
    results.map(({ title, url }) =>
      extractFromMoviePage({
        title,
        url: new URL(url, BASE_URL).toString(),
      }),
    ),
  )).flat()

  return makeScreeningsUniqueAndSorted(screenings)
}

runIfMain(extractFromMainPage, import.meta.url)

export default extractFromMainPage

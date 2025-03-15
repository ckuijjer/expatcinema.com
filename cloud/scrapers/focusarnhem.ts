import { DateTime } from 'luxon'
import Xray from 'x-ray'

import { logger as parentLogger } from '../powertools'
import { Screening } from '../types'
import xRayPuppeteer from '../xRayPuppeteer'
import { guessYear } from './utils/guessYear'
import { monthToNumber } from './utils/monthToNumber'
import { splitTime } from './utils/splitTime'
import { titleCase } from './utils/titleCase'

const logger = parentLogger.createChild({
  persistentLogAttributes: {
    scraper: 'focusarnhem',
  },
})

const trim = (value) => (typeof value === 'string' ? value.trim() : value)

const cleanTitle = (value) =>
  typeof value === 'string'
    ? titleCase(value.replace(/^Expat Cinema: /gi, ''))
    : value

const toLowerCase = (value) =>
  typeof value === 'string' ? value.toLowerCase() : value

const replaceNoBreakSpace = (value) =>
  typeof value === 'string' ? value.replace(/\u00a0/g, ' ') : value

const normalizeWhitespace = (value) =>
  typeof value === 'string' ? value.replace(/\s+/g, ' ') : value

const xray = Xray({
  filters: {
    cleanTitle,
    replaceNoBreakSpace,
    toLowerCase,
    trim,
    normalizeWhitespace,
  },
})
  .driver(
    xRayPuppeteer({
      logger,
      waitForOptions: { timeout: 60_000, waitUntil: 'networkidle2' },
    }),
  )
  .concurrency(10)
  .throttle(10, 300)

type XRayFromMoviePage = {
  title: string
  metadata: string
  screenings: {
    date: string
    times: string[]
  }[]
}

type XRayFromMainPage = {
  title: string
  url: string
}

const hasEnglishSubtitles = (movie: XRayFromMoviePage) => {
  return /ondertiteling: english/i.test(movie.metadata)
}

const splitDate = (date: string) => {
  if (date === 'Vandaag') {
    const { day, month, year } = DateTime.now()
    return { day, month, year }
  } else if (date === 'Morgen') {
    const { day, month, year } = DateTime.now().plus({ days: 1 })
    return { day, month, year }
  } else {
    const [dayString, monthString] = date
      .split(/\s+/) // ['Woensdag 8 mei'] => ['Woensdag', '8', 'mei']
      .slice(1) // ['Woensdag', '8', 'mei'] => ['8', 'mei']

    const day = Number(dayString)
    const month = monthToNumber(monthString)

    const year = guessYear({
      day,
      month,
    })

    return { day, month, year }
  }
}

const extractFromMoviePage = async (url: string): Promise<Screening[]> => {
  logger.info('extracting', { url })

  const movie: XRayFromMoviePage = await xray(url, {
    title: 'h1 | trim | cleanTitle',
    metadata: '#credits | normalizeWhitespace | trim',
    screenings: xray('#movie-times li', [
      {
        date: '.date | trim',
        times: ['a .text | trim'],
      },
    ]),
  })

  logger.info('extractFromMoviePage', { movie })

  if (!hasEnglishSubtitles(movie)) {
    logger.warn('extractFromMoviePage without english subtitles', {
      url,
      title: movie.title,
    })
    return []
  }

  const screenings: Screening[] = movie.screenings.flatMap(
    ({ date, times }) => {
      const { day, month, year } = splitDate(date)

      return times.map((time) => {
        const [hour, minute] = splitTime(time)

        return {
          title: cleanTitle(movie.title),
          url,
          cinema: 'Focus Arnhem',
          date: DateTime.fromObject({
            day,
            month,
            year,
            hour,
            minute,
          }).toJSDate(),
        }
      })
    },
  )

  return screenings
}

const extractFromMainPage = async () => {
  const url = 'https://www.focusarnhem.nl/special/focus-expat-cinema/'

  const movies: XRayFromMainPage[] = await xray(
    url,
    '#special-films .movie-block',
    [
      {
        title: '@title | trim | cleanTitle',
        url: '@href',
      },
    ],
  )

  logger.info('movies', { movies })

  const screenings = (
    await Promise.all(movies.map(({ url }) => extractFromMoviePage(url)))
  ).flat()

  logger.info('extractFromMainPage', { screenings })

  return screenings
}

if (import.meta.url === new URL(import.meta.url).href) {
  extractFromMainPage()
    .then((x) => JSON.stringify(x, null, 2))
    .then(console.log)

  //   extractFromMoviePage(
  //     //     'https://www.focusarnhem.nl/agenda/un-metier-serieux/',
  //     'https://www.focusarnhem.nl/agenda/expat-cinema-the-peasants/',
  //   )
  //     .then((x) => JSON.stringify(x, null, 2))
  //     .then(console.log)
}

export default extractFromMainPage

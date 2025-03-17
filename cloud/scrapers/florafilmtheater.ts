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
    scraper: 'florafilmtheater',
  },
})

const trim = (value) => (typeof value === 'string' ? value.trim() : value)

const cleanTitle = (value) =>
  typeof value === 'string' ? titleCase(value.replace(/\(.*\)$/gi, '')) : value

const normalizeWhitespace = (value) =>
  typeof value === 'string' ? value.replace(/\s+/g, ' ') : value

const xray = Xray({
  filters: {
    cleanTitle,
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

type XRayFromMainPage = {
  title: string
  url: string
  metadata: string[]
  screenings: string[]
}

const hasEnglishSubtitles = (movie: XRayFromMainPage) => {
  return movie.metadata.includes('EN SUBS')
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
      .replace('.', '') // '8 mei.' => '8 mei'
      .split(/\s+/) // ['wo 8 mei'] => ['wo', '8', 'mei']
      .slice(1) // ['wo', '8', 'mei'] => ['8', 'mei']

    const day = Number(dayString)
    const month = monthToNumber(monthString)

    const year = guessYear({
      day,
      month,
    })

    return { day, month, year }
  }
}

const extractFromMainPage = async (): Promise<Screening[]> => {
  try {
    const url = 'https://florafilmtheater.nl/agenda'

    const movies: XRayFromMainPage[] = await xray(url, '.flex.flex-col.gap-8', [
      {
        title: 'a h2 | trim | cleanTitle',
        url: 'a@href',
        metadata: ['a ul li | normalizeWhitespace | trim'],
        screenings: ['> div .slide__item | normalizeWhitespace | trim'],
      },
    ])

    logger.info('movies', { movies })

    const moviesWithEnglishSubtitles = movies.filter(hasEnglishSubtitles)

    if (moviesWithEnglishSubtitles.length === 0) {
      logger.warn('no movies with english subtitles')
      return []
    }

    logger.info('movies', { moviesWithEnglishSubtitles })

    const screenings: Screening[] = moviesWithEnglishSubtitles.flatMap(
      (movie) => {
        return movie.screenings.map((screening) => {
          const lastSpaceIndex = screening.lastIndexOf(' ')
          const date = screening.substring(0, lastSpaceIndex)
          const time = screening.substring(lastSpaceIndex + 1)

          const { day, month, year } = splitDate(date)
          const [hour, minute] = splitTime(time)

          return {
            title: movie.title,
            url: movie.url,
            cinema: 'Flora Filmtheater',
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

    logger.info('screenings', { screenings })

    return screenings
  } catch (error) {
    logger.error('error scraping florafilmtheater', { error })
    return []
  }
}

if (
  (typeof module === 'undefined' || module.exports === undefined) && // running in ESM
  import.meta.url === new URL(import.meta.url).href // running as main module, not importing from another module
) {
  extractFromMainPage()
    .then((x) => JSON.stringify(x, null, 2))
    .then(console.log)
}

export default extractFromMainPage

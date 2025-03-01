import { DateTime } from 'luxon'
import Xray from 'x-ray'

import { logger as parentLogger } from '../powertools'
import xRayPuppeteer from '../xRayPuppeteer'
import { guessYear } from './utils/guessYear'
import { shortMonthToNumberDutch } from './utils/monthToNumber'
import { splitTime } from './utils/splitTime'
import { titleCase } from './utils/titleCase'

const logger = parentLogger.createChild({
  persistentLogAttributes: {
    scraper: 'lab111',
  },
})

const xray = Xray({
  filters: {
    trim: (value) => (typeof value === 'string' ? value.trim() : value),
    cleanTitle: (value) =>
      typeof value === 'string' ? value.replace(/\(.*\)\s+$/, '') : value,
    normalizeWhitespace: (value) =>
      typeof value === 'string' ? value.replace(/\s+/g, ' ') : value,
  },
})
  .driver(xRayPuppeteer({ logger, waitForOptions: { timeout: 60_000 } }))
  .concurrency(10)
  .throttle(10, 300)

const hasEnglishSubtitles = (movie: XRayFromMainPage) =>
  movie.metadata.includes('Ondertiteling: Engels')

const cleanTitle = (title: string) => {
  return titleCase(
    title
      .replace(/ \(4k Restoration\)/i, '')
      .replace(' (with English subtitles)', '')
      .replace(/^Club Imagine:\s+/i, '')
      .replace(/^HoFF x IQMF:\s+/i, ''),
  )
}

type XRayFromMainPage = {
  title: string
  url: string
  metadata: string
  dates: string[]
}

const extractFromMainPage = async () => {
  try {
    logger.info('main page')

    const scrapeResult: XRayFromMainPage[] = await xray(
      // 'http://webcache.googleusercontent.com/search?q=cache:https://www.lab111.nl/programma/',
      'https://www.lab111.nl/programma/',
      '#programmalist .filmdetails',
      [
        {
          title: 'h2.hidemobile a | trim | cleanTitle',
          url: 'h2.hidemobile a@href | trim',
          metadata: '.row.hidemobile | normalizeWhitespace',
          dates: ['.day td:first-child | trim'],
        },
      ],
    )

    logger.info('scrape result', { scrapeResult })

    const screenings = scrapeResult
      .filter(hasEnglishSubtitles)
      .flatMap((movie) => {
        return movie.dates.map((date) => {
          const [dayOfWeek, dayString, monthString, time] = date.split(/\s+/)
          const day = Number(dayString)
          const month = shortMonthToNumberDutch(monthString)
          const [hour, minute] = splitTime(time)
          const year = guessYear({
            day,
            month,
            hour,
            minute,
          })

          logger.debug('extracted date', {
            dateString: date,
            date: {
              day,
              month,
              hour,
              minute,
              year,
            },
          })

          return {
            title: cleanTitle(movie.title),
            url: movie.url,
            cinema: 'Lab111',
            date: DateTime.fromObject({
              day,
              month,
              hour,
              minute,
              year,
            }).toJSDate(),
          }
        })
      })

    logger.info('screenings found', { screenings })

    return screenings
  } catch (error) {
    logger.error('error scraping lab111', { error })
    return []
  }
}

if (require.main === module) {
  extractFromMainPage()
    .then((x) => JSON.stringify(x, null, 2))
    .then(console.log)

  // extractFromMoviePage({
  //   url: 'https://www.lab111.nl/movie/tampopo/',
  // }).then(console.log)
}

export default extractFromMainPage

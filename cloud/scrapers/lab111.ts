import Xray from 'x-ray'
import { DateTime } from 'luxon'
import splitTime from './utils/splitTime'
import { shortMonthToNumberDutch } from './utils/monthToNumber'
import guessYear from './utils/guessYear'
import xRayPuppeteer from '../xRayPuppeteer'

import { logger as parentLogger } from '../powertools'

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
  .driver(xRayPuppeteer({ logger, waitForOptions: { timeout: 60000 } }))
  .concurrency(10)
  .throttle(10, 300)

const hasEnglishSubtitles = (movie: XRayFromMainPage) =>
  movie.metadata.includes('Ondertiteling: Engels')

const cleanTitle = (title: string) =>
  title.replace(' (with English subtitles)', '')

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
      'http://webcache.googleusercontent.com/search?q=cache:https://www.lab111.nl/programma/',
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

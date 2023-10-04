import Xray from 'x-ray'
import { DateTime } from 'luxon'
import xRayPuppeteer from '../xRayPuppeteer'

import { logger as parentLogger } from '../powertools'
import { Screening } from 'types'
import { shortMonthToNumberDutch } from './utils/monthToNumber'
import splitTime from './utils/splitTime'
import guessYear from './utils/guessYear'

const logger = parentLogger.createChild({
  persistentLogAttributes: {
    scraper: 'schuur',
  },
})

const xray = Xray({
  filters: {
    trim: (value) => (typeof value === 'string' ? value.trim() : value),
    cleanTitle: (value) =>
      typeof value === 'string'
        ? value.replace(/^Expat Cinema:\s+/i, '')
        : value,
    normalizeWhitespace: (value) =>
      typeof value === 'string' ? value.replace(/\s+/g, ' ') : value,
  },
})
  .driver(xRayPuppeteer({ logger }))
  .concurrency(10)
  .throttle(10, 300)

type XRayFromMainPage = {
  title: string
  url: string
  date: string
  time: string
}

const extractFromMainPage = async () => {
  try {
    logger.info('main page')

    const scrapeResult: XRayFromMainPage[] = await xray(
      'https://www.schuur.nl/expat-cinema',
      'main section > div > .items-start', // for each movie there is a .items-start
      [
        {
          title: 'h4 | cleanTitle | trim',
          url: 'a@href | trim',
          date: 'h3 | trim',
          time: '.w-full > div > div > span | trim',
        },
      ],
    )

    logger.info('scrape result', { scrapeResult })

    const screenings: Screening[] = scrapeResult.map(
      ({ title, url, date, time }) => {
        const [dayOfWeek, dayString, monthString] = date.split(/\s+/)
        const day = Number(dayString)
        const month = shortMonthToNumberDutch(monthString)
        const [hour, minute] = splitTime(time)

        const year = guessYear(
          DateTime.fromObject({
            day,
            month,
            hour,
            minute,
          }),
        )

        return {
          title,
          url,
          cinema: 'Schuur',
          date: DateTime.fromObject({
            day,
            month,
            year,
            hour,
            minute,
          }).toJSDate(),
        }
      },
    )

    logger.info('screenings found', { screenings })

    return screenings
  } catch (error) {
    logger.error('error scraping schuur', { error })
  }
}

if (require.main === module) {
  extractFromMainPage()
    .then((x) => JSON.stringify(x, null, 2))
    .then(console.log)
}

export default extractFromMainPage

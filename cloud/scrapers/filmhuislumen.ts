import Xray from 'x-ray'
import { DateTime } from 'luxon'

import { shortMonthToNumberDutch } from './utils/monthToNumber'
import guessYear from './utils/guessYear'
import { Screening } from '../types'
import { logger as parentLogger } from '../powertools'

const logger = parentLogger.createChild({
  persistentLogAttributes: {
    scraper: 'filmhuislumen',
  },
})

const splitTimeDot = (time: string) => time.split('.').map((x) => Number(x))

const xray = Xray({
  filters: {
    trim: (value) => (typeof value === 'string' ? value.trim() : value),
    cleanTitle: (value) =>
      typeof value === 'string'
        ? value
            .replace(/\(.*\)$/, '') // e.g. (English subtitles)
            .replace(/^.*:/, '') // e.g. Expat Cinema:
        : value,
    normalizeWhitespace: (value) =>
      typeof value === 'string' ? value.replace(/\s+/g, ' ') : value,
  },
})
  .concurrency(10)
  .throttle(10, 300)

type XRayFromMainPage = {
  title: string
  url: string
  date: string
  time: string
}

const extractFromMainPage = async () => {
  // look at the HTML for the page, not Chrome' DevTools, as there's JavaScript that changed the HTML.
  const scrapeResults: XRayFromMainPage[] = await xray(
    'https://filmhuis-lumen.nl/expat-cinema/',
    '.theater-show',
    [
      {
        title: 'h3 | normalizeWhitespace | cleanTitle | trim',
        url: 'a@href',
        date: '.dedate .dedatumblack | normalizeWhitespace | trim',
        time: '.dedate a | trim',
      },
    ],
  )

  logger.info('scraped https://filmhuis-lumen.nl/expat-cinema/', {
    scrapeResults,
  })

  const screenings: Screening[] = scrapeResults
    .filter(({ date, time }) => date && time) // remove the movies that don't have a screening time (yet)
    .map(({ title, url, date, time }) => {
      logger.info('mapping', { title, url, date, time })

      const [dayString, monthString] = date.split(' ')
      const day = Number(dayString)
      const month = shortMonthToNumberDutch(monthString)

      const [hour, minute] = splitTimeDot(time)

      const year = guessYear({
        day,
        month,
        hour,
        minute,
      })

      return {
        title,
        url,
        cinema: 'Filmhuis Lumen',
        date: DateTime.fromObject({
          year,
          day,
          month,
          hour,
          minute,
        }).toJSDate(),
      }
    })

  logger.info('screenings', { screenings })

  return screenings
}

if (require.main === module) {
  extractFromMainPage()
    .then((x) => JSON.stringify(x, null, 2))
    .then(console.log)
}

export default extractFromMainPage

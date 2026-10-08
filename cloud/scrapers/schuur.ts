import got from 'got'
import { DateTime } from 'luxon'
import Xray from 'x-ray'

import { logger as parentLogger } from '../powertools'
import { Screening } from '../types'
import xRayPuppeteer from '../xRayPuppeteer'
import { guessYear } from './utils/guessYear'
import { shortMonthToNumberDutch } from './utils/monthToNumber'
import { splitTime } from './utils/splitTime'
import { titleCase } from './utils/titleCase'
import { normalizeWhitespace, trim } from './utils/xrayFilters'

const logger = parentLogger.createChild({
  persistentLogAttributes: {
    scraper: 'schuur',
  },
})

const xray = Xray({
  filters: {
    trim,
    cleanTitle: (value) =>
      typeof value === 'string'
        ? titleCase(
            value
              .replace(/^Expat Cinema:\s+/i, '')
              .replace(/ - English subs$/i, ''),
          )
        : value,
    normalizeWhitespace,
  },
})
  .driver(xRayPuppeteer({ logger }))
  .concurrency(3)
  .throttle(10, 300)

// The film page lists the year with the country and duration, e.g.
// <li><strong>Jaar</strong> <span>1996</span></li> (Shall We Dance?). Not
// every page has it (a children's programme or a short film programme).
export const extractYear = (html: string) => {
  const year = html.match(
    /<strong>\s*Jaar\s*<\/strong>\s*<span>\s*(\d{4})\s*<\/span>/i,
  )?.[1]

  return year &&
    Number(year) >= 1888 &&
    Number(year) <= new Date().getFullYear() + 2
    ? Number(year)
    : undefined
}

// A film without a year, or a page that can't be fetched, just has no year
const fetchYear = async (url: string) => {
  try {
    return extractYear(await got(url).text())
  } catch (error) {
    logger.warn('could not fetch the film page for the year', { url, error })
    return undefined
  }
}

type XRayFromMainPage = {
  title: string
  url: string
  date: string
  time: string
}

const extractFromMainPage = async () => {
  try {
    logger.debug('main page')

    const scrapeResult: XRayFromMainPage[] = await xray(
      'https://www.schuur.nl/expat-cinema',
      'main section > div > .items-start', // for each movie there is a .items-start
      [
        {
          title: 'h4 | normalizeWhitespace | trim | cleanTitle | trim',
          url: 'a@href | trim',
          date: 'h3 | trim',
          time: '.w-full > div > div > span | trim',
        },
      ],
    )

    logger.debug('scrape result', { scrapeResult })

    // The film pages are server rendered, so a plain request is enough
    const urls = Array.from(new Set(scrapeResult.map(({ url }) => url)))
    const years = new Map(
      await Promise.all(
        urls.map(async (url) => [url, await fetchYear(url)] as const),
      ),
    )

    const screenings: Screening[] = scrapeResult.map(
      ({ title, url, date, time }) => {
        const [dayOfWeek, dayString, monthString] = date.split(/\s+/)
        const day = Number(dayString)
        const month = shortMonthToNumberDutch(monthString)
        const [hour, minute] = splitTime(time)

        const year = guessYear({
          day,
          month,
          hour,
          minute,
        })

        return {
          title,
          year: years.get(url),
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

    logger.debug('screenings found', { screenings })

    return screenings
  } catch (error) {
    logger.error('error scraping schuur', { error })
    return []
  }
}

export default extractFromMainPage

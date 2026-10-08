import { decode } from 'html-entities'
import { DateTime } from 'luxon'
import pMap from 'p-map'

import { logger as parentLogger } from '../powertools'
import { Screening } from '../types'
import { shortMonthToNumberDutch } from './utils/monthToNumber'
import { splitTime } from './utils/splitTime'
import { titleCase } from './utils/titleCase'
import { createXray } from '../xRay'

const logger = parentLogger.createChild({
  persistentLogAttributes: {
    scraper: 'concordia',
  },
})

const xray = createXray({ logger })

type XRayScreening = {
  date: string
  title: string
  url: string
  times: string[]
}

// e.g. "21 mrt 2026" -> { day: 21, month: 3, year: 2026 }
const parseDate = (date: string) => {
  const [dayString, monthString, yearString] = date.split(' ')
  const day = Number(dayString)
  const month = shortMonthToNumberDutch(monthString)
  const year = Number(yearString)
  return { day, month, year }
}

// e.g. "Japan, 1996" -> 1996, "Roemenië,Frankrijk,Noorwegen, 2026" -> 2026
// The "Herkomst" of a film page is the countries followed by the year of production
export const parseOriginYear = (origin?: string) => {
  const year = Number(origin?.trim().match(/,\s*((?:18|19|20)\d{2})$/)?.[1])

  return year >= 1888 && year <= new Date().getFullYear() + 2 ? year : undefined
}

// A page without a "Herkomst" (e.g. a concert registration) has no year
const extractYear = async (url: string) => {
  try {
    const { origin } = await xray(url, { origin: '.herkomst .value | trim' })
    return parseOriginYear(origin)
  } catch (error) {
    logger.warn('failed to extract the year', { url, error })
    return undefined
  }
}

const extractFromMainPage = async (): Promise<Screening[]> => {
  logger.debug('extracting main page')

  const results: XRayScreening[] = await xray(
    'https://www.concordia.nl/eng-subs',
    'div.film.OverviewListItem',
    [
      {
        date: 'li.label | trim',
        title: 'h4.heading-4.event-title a | trim',
        url: 'h4.heading-4.event-title a@href',
        times: ['span.big | trim'],
      },
    ],
  )

  logger.debug('main page', { results })

  if (results.length === 0) {
    logger.error('No screenings found on main page, scraper is probably broken')
    return []
  }

  const urls = Array.from(new Set(results.map(({ url }) => url)))
  const years = new Map(
    await pMap(urls, async (url) => [url, await extractYear(url)] as const, {
      concurrency: 3,
    }),
  )

  const screenings = results
    .filter(({ date, times }) => date && times.length > 0)
    .flatMap(({ date, title, url, times }) => {
      const { day, month, year } = parseDate(date)

      return times.map((time) => {
        const [hour, minute] = splitTime(time)

        return {
          title: titleCase(decode(title)),
          year: years.get(url),
          url,
          cinema: 'Concordia',
          date: DateTime.fromObject({
            day,
            month,
            year,
            hour,
            minute,
          }).toJSDate(),
        }
      })
    })

  logger.debug('screenings', { screenings })

  return screenings
}

export default extractFromMainPage

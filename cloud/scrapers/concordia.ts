import { decode } from 'html-entities'
import { DateTime } from 'luxon'

import { logger as parentLogger } from '../powertools'
import { Screening } from '../types'
import { shortMonthToNumberDutch } from './utils/monthToNumber'
import { runIfMain } from './utils/runIfMain'
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

  const screenings = results
    .filter(({ date, times }) => date && times.length > 0)
    .flatMap(({ date, title, url, times }) => {
      const { day, month, year } = parseDate(date)

      return times.map((time) => {
        const [hour, minute] = splitTime(time)

        return {
          title: titleCase(decode(title)),
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

runIfMain(extractFromMainPage, import.meta.url)

export default extractFromMainPage

import { DateTime } from 'luxon'
import Xray from 'x-ray'

import { logger as parentLogger } from '../powertools'
import { Screening } from '../types'
import { guessYear } from './utils/guessYear'
import { makeScreeningsUniqueAndSorted } from './utils/makeScreeningsUniqueAndSorted'
import { shortMonthToNumberDutch } from './utils/monthToNumber'
import { runIfMain } from './utils/runIfMain'
import { splitTime } from './utils/splitTime'
import { titleCase } from './utils/titleCase'
import { trim } from './utils/xrayFilters'

const logger = parentLogger.createChild({
  persistentLogAttributes: {
    scraper: 'dewittdordrecht',
  },
})

const BASE_URL = 'https://www.dewittdordrecht.nl'

const xray = Xray({
  filters: {
    trim,
    normalizeWhitespace: (value) =>
      typeof value === 'string' ? value.replace(/\s+/g, ' ') : value,
  },
})
  .concurrency(10)
  .throttle(10, 300)

type XRayFromMainPage = {
  title: string
  url: string
}

type XRayFromMoviePage = {
  screenings: {
    date: string
    times: string[]
  }[]
}

const cleanTitle = (title: string) =>
  titleCase(title.replace(/^Expat Cinema:\s*/i, ''))

const parseDate = (date: string, time: string) => {
  const [, dayString, monthStringWithDot] = date.split(/\s+/)
  const day = Number(dayString)
  const month = shortMonthToNumberDutch(monthStringWithDot.replace(/\.$/, ''))
  const [hour, minute] = splitTime(time)
  const year = guessYear({ day, month, hour, minute })

  return DateTime.fromObject(
    {
      day,
      month,
      year,
      hour,
      minute,
    },
    {
      zone: 'Europe/Amsterdam',
    },
  ).toJSDate()
}

const extractFromMoviePage = async ({
  title,
  url,
}: XRayFromMainPage): Promise<Screening[]> => {
  const movie: XRayFromMoviePage = await xray(url, {
    screenings: xray('.showtijden', [
      {
        date: 'p.fw-bold | normalizeWhitespace | trim',
        times: ['a.btn-times | normalizeWhitespace | trim'],
      },
    ]),
  })

  logger.info('movie page', { url, movie })

  return makeScreeningsUniqueAndSorted(
    movie.screenings.flatMap(({ date, times }) =>
      times.map((time) => ({
        title: cleanTitle(title),
        url,
        cinema: 'Filmtheater De Witt',
        date: parseDate(date, time),
      })),
    ),
  )
}

const extractFromMainPage = async (): Promise<Screening[]> => {
  const results: XRayFromMainPage[] = await xray(
    `${BASE_URL}/filmtheater/`,
    'a.card-link',
    [
      {
        title: '@title',
        url: '@href',
      },
    ],
  )

  logger.info('main page', { results })

  const expatCinemaPages = results
    .filter(({ title }) => title?.toLowerCase().includes('expat cinema'))
    .map(({ title, url }) => ({
      title,
      url: new URL(url, BASE_URL).toString(),
    }))

  const screenings = (
    await Promise.all(expatCinemaPages.map(extractFromMoviePage))
  ).flat()

  return makeScreeningsUniqueAndSorted(screenings)
}

runIfMain(extractFromMainPage, import.meta.url)

export default extractFromMainPage

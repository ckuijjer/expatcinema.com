import { DateTime } from 'luxon'
import Xray from 'x-ray'

import { logger as parentLogger } from '../powertools'
import { Screening } from '../types'
import { extractYearFromTitle } from './utils/extractYearFromTitle'
import { makeScreeningsUniqueAndSorted } from './utils/makeScreeningsUniqueAndSorted'
import { removeYearSuffix } from './utils/removeYearSuffix'
import { runIfMain } from './utils/runIfMain'
import { titleCase } from './utils/titleCase'
import { trim } from './utils/xrayFilters'

const logger = parentLogger.createChild({
  persistentLogAttributes: {
    scraper: 'desien',
  },
})

const xray = Xray({
  filters: {
    trim,
    normalizeWhitespace: (value) =>
      typeof value === 'string' ? value.replace(/\s+/g, ' ') : value,
  },
})
  .concurrency(10)
  .throttle(10, 300)

type XRayResult = {
  url: string
  title: string
  date: string
  time: string
  location: string
  tags: string
}

const parseScreeningDate = (date: string, time: string) => {
  const parsed = DateTime.fromFormat(`${date} ${time}`, 'yyyyMMdd HH:mm', {
    zone: 'Europe/Amsterdam',
  })

  if (!parsed.isValid) {
    throw new Error(`Could not parse De Sien screening date: ${date} ${time}`)
  }

  return parsed.toJSDate()
}

const cleanTitle = (title: string) => titleCase(removeYearSuffix(title))

const extractFromMainPage = async (): Promise<Screening[]> => {
  const results: XRayResult[] = await xray(
    'https://desienfilm.nl/films?filter=englishsubs&datum=alle-tijden',
    'a.item.element',
    [
      {
        url: '@href',
        title: 'h2 | normalizeWhitespace | trim',
        date: '@data-date',
        time: '.cont .date | normalizeWhitespace | trim',
        location: '.special | normalizeWhitespace | trim',
        tags: '@data-genre',
      },
    ],
  )

  logger.info('main page', { results })

  const screenings = results
    .filter(
      ({ tags, location }) =>
        tags?.toLowerCase().includes('englishsubs') &&
        location?.toLowerCase().includes('de sien @kanaal30'),
    )
    .map(({ title, url, date, time }) => ({
      title: cleanTitle(title),
      year: extractYearFromTitle(title),
      url,
      cinema: 'De Sien',
      date: parseScreeningDate(date, time),
    }))

  return makeScreeningsUniqueAndSorted(screenings)
}

runIfMain(extractFromMainPage, import.meta.url)

export default extractFromMainPage

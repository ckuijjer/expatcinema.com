import got from 'got'
import { DateTime } from 'luxon'
import Xray from 'x-ray'

import { logger as parentLogger } from '../powertools'
import { Screening } from '../types'
import { makeScreeningsUniqueAndSorted } from './utils/makeScreeningsUniqueAndSorted'
import { runIfMain } from './utils/runIfMain'
import { titleCase } from './utils/titleCase'
import { trim } from './utils/xrayFilters'

const logger = parentLogger.createChild({
  persistentLogAttributes: {
    scraper: 'chasse',
  },
})

const BASE_URL = 'https://www.chasse.nl'

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
  title: string
  url: string
  venue: string
  startsAt: string
}

const parseDate = (startsAt: string) => {
  const parsed = DateTime.fromFormat(startsAt, 'yyyy-MM-dd HH:mm:ss', {
    zone: 'Europe/Amsterdam',
  })

  if (!parsed.isValid) {
    throw new Error(`Could not parse Chasse screening date: ${startsAt}`)
  }

  return parsed.toJSDate()
}

const cleanTitle = (title: string) =>
  titleCase(
    title
      .replace(/^Internationals Cinema:\s*/i, '')
      .replace(/^Internationals Cinema Breda:\s*/i, '')
      .replace(/\s*\(EN subs\)$/i, ''),
  )

const extractFromMainPage = async (): Promise<Screening[]> => {
  const html = await got(
    'https://www.chasse.nl/nl/internationals-cinema-breda-chasse-cinema-breda-13gr',
  ).text()

  const results: XRayResult[] = await xray(html, '.eventCard', [
    {
      title: 'h3.title | normalizeWhitespace | trim',
      url: 'a.desc@href',
      venue: '.venue | normalizeWhitespace | trim',
      startsAt: 'a.btn-order@data-event-start',
    },
  ])

  logger.info('main page', { results })

  const screenings = results
    .filter(({ title }) => title?.toLowerCase().includes('en subs'))
    .map(({ title, url, startsAt }) => ({
      title: cleanTitle(title),
      url: new URL(url, BASE_URL).toString(),
      cinema: 'Chassé Cinema',
      date: parseDate(startsAt),
    }))

  return makeScreeningsUniqueAndSorted(screenings)
}

runIfMain(extractFromMainPage, import.meta.url)

export default extractFromMainPage

import got from 'got'
import { decode } from 'html-entities'
import { DateTime } from 'luxon'
import Xray from 'x-ray'

import { logger as parentLogger } from '../powertools'
import { Screening } from '../types'
import { makeScreeningsUniqueAndSorted } from './utils/makeScreeningsUniqueAndSorted'
import { runIfMain } from './utils/runIfMain'
import { trim } from './utils/xrayFilters'

const logger = parentLogger.createChild({
  persistentLogAttributes: {
    scraper: 'worm',
  },
})

const BASE_URL = 'https://worm.org'
const SHOW_TIME = '21:30'

const xray = Xray({
  filters: {
    trim,
    normalizeWhitespace: (value) =>
      typeof value === 'string' ? value.replace(/\s+/g, ' ') : value,
  },
})
  .concurrency(10)
  .throttle(10, 300)

type SearchResult = {
  id: number
  title: string
  url: string
  subtype: string
}

type ProgrammeEntry = {
  text: string
  url: string
}

const parseProgrammeEntry = (entry: ProgrammeEntry, year: number): Screening => {
  const normalized = decode(entry.text)
    .replace(/[–—]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()

  const match = normalized.match(
    /^(?<month>[A-Za-z]+)\s+(?<day>\d+)\s*-\s*(?<title>.+?)\s+\(/,
  )

  if (!match?.groups) {
    throw new Error(`Could not parse WORM programme entry: ${normalized}`)
  }

  const parsedDate = DateTime.fromFormat(
    `${match.groups.month} ${match.groups.day} ${year} ${SHOW_TIME}`,
    'LLLL d yyyy HH:mm',
    { zone: 'Europe/Amsterdam' },
  )

  if (!parsedDate.isValid) {
    throw new Error(`Could not parse WORM date: ${normalized}`)
  }

  return {
    title: match.groups.title.trim(),
    url: new URL(entry.url, BASE_URL).toString(),
    cinema: 'WORM',
    date: parsedDate.toJSDate(),
  }
}

const getProgrammePageUrl = async (year: number): Promise<string | null> => {
  const results = await got
    .get(`${BASE_URL}/wp-json/wp/v2/search`, {
      searchParams: {
        search: `filmtuin ${year}`,
      },
    })
    .json<SearchResult[]>()

  logger.info('search results', { year, results })

  const programmePage = results.find(
    ({ subtype, url }) =>
      subtype === 'post' && url.toLowerCase().includes(`filmtuin-${year}`),
  )

  return programmePage?.url ?? null
}

const extractFromMainPage = async (): Promise<Screening[]> => {
  const year = DateTime.now().year
  const programmePageUrl = await getProgrammePageUrl(year)

  if (!programmePageUrl) {
    logger.info('no current filmtuin page found', { year })
    return []
  }

  const entries: ProgrammeEntry[] = await xray(
    programmePageUrl,
    '.fc__text a[href*="/production/filmtuin-"]',
    [
      {
        text: 'text() | normalizeWhitespace | trim',
        url: '@href',
      },
    ],
  )

  logger.info('programme page', { programmePageUrl, entries })

  const today = DateTime.now().startOf('day')

  return makeScreeningsUniqueAndSorted(
    entries
      .map((entry) => parseProgrammeEntry(entry, year))
      .filter(({ date }) => DateTime.fromJSDate(date) >= today),
  )
}

runIfMain(extractFromMainPage, import.meta.url)

export default extractFromMainPage

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
const SEARCH_TERM = 'subtitle'

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

type ProductionPage = {
  title: string
  programme: string
  dateText: string
  startText: string
  detailParagraphs: string[]
}

const parseScreeningDate = (dateText: string, startText: string) => {
  const normalizedDateText = decode(dateText).replace(/\s+/g, ' ').trim()
  const normalizedStartText = decode(startText).replace(/\s+/g, ' ').trim()

  const dateMatch = normalizedDateText.match(
    /(?<weekday>Mon|Tue|Wed|Thu|Fri|Sat|Sun)\s+(?<day>\d{1,2})\s+(?<month>[A-Za-z]+)\s+(?<year>\d{4})/i,
  )
  const timeMatch = normalizedStartText.match(/(?<time>\d{1,2}:\d{2})/)

  if (!dateMatch?.groups || !timeMatch?.groups?.time) {
    throw new Error(
      `Could not parse WORM screening date: ${normalizedDateText} ${normalizedStartText}`,
    )
  }

  const parsedDate = DateTime.fromFormat(
    `${dateMatch.groups.weekday} ${dateMatch.groups.day} ${dateMatch.groups.month} ${dateMatch.groups.year} ${timeMatch.groups.time}`,
    'ccc d LLLL yyyy HH:mm',
    { zone: 'Europe/Amsterdam' },
  )

  if (!parsedDate.isValid) {
    throw new Error(
      `Could not parse WORM date: ${normalizedDateText} ${normalizedStartText}`,
    )
  }

  return parsedDate.toJSDate()
}

const getProductionResults = async (): Promise<SearchResult[]> => {
  const results = await got
    .get(`${BASE_URL}/wp-json/wp/v2/search`, {
      searchParams: {
        search: SEARCH_TERM,
        per_page: 100,
      },
    })
    .json<SearchResult[]>()

  const productions = results.filter(
    ({ subtype, url }) =>
      subtype === 'wp_theatre_prod' && url.startsWith(`${BASE_URL}/production/`),
  )

  logger.info('search results', {
    searchTerm: SEARCH_TERM,
    count: productions.length,
    productions,
  })

  return productions
}

const hasEnglishSubtitles = (paragraphs: string[]) =>
  paragraphs.some((paragraph) =>
    paragraph.toLowerCase().includes('english subtitles'),
  )

const parseMetadataParagraph = (paragraph: string) => {
  const normalized = decode(paragraph).replace(/\s+/g, ' ').trim()
  const yearMatch = normalized.match(/\b(?<year>\d{4})\b/)

  return {
    normalized,
    year: yearMatch?.groups?.year ? Number(yearMatch.groups.year) : undefined,
  }
}

const parseTitleAndYear = (page: ProductionPage) => {
  const metadataParagraphs = page.detailParagraphs
    .map(parseMetadataParagraph)
    .filter(({ normalized }) => normalized.toLowerCase().includes('english subtitles'))

  if (metadataParagraphs.length !== 1) {
    return null
  }

  const titleFromMetadata = metadataParagraphs[0].normalized.match(
    /(?<title>.+?)(?:\s*by\s+|\s*Directed by\s+|\s*Dir:\s*).+?\b\d{4}\b/i,
  )?.groups?.title

  const title =
    titleFromMetadata || decode(page.title).replace(/\s+/g, ' ').trim()

  return {
    title,
    year: metadataParagraphs[0].year,
  }
}

const extractFromProductionPage = async ({
  title,
  url,
}: SearchResult): Promise<Screening[]> => {
  const page: ProductionPage = await xray(url, {
    title: 'h1 | normalizeWhitespace | trim',
    programme: '.agenda-single-meta__subtitle | normalizeWhitespace | trim',
    dateText: '.agenda-single-meta__date | normalizeWhitespace | trim',
    startText: '.agenda-single-meta__start | normalizeWhitespace | trim',
    detailParagraphs: xray('.single-container__content__other p', [
      ' | normalizeWhitespace | trim',
    ]),
  })

  logger.info('production page', { title, url, page })

  if (!hasEnglishSubtitles(page.detailParagraphs)) {
    return []
  }

  const titleAndYear = parseTitleAndYear(page)

  if (!titleAndYear) {
    logger.info('skipping ambiguous multi-film production', { title, url, page })
    return []
  }

  return [
    {
      title: titleAndYear.title,
      year: titleAndYear.year,
      url: new URL(url, BASE_URL).toString(),
      cinema: 'WORM',
      date: parseScreeningDate(page.dateText, page.startText),
    },
  ]
}

const extractFromMainPage = async (): Promise<Screening[]> => {
  const productions = await getProductionResults()

  const now = DateTime.now().minus({ hours: 1 }).toJSDate()
  const screenings = (
    await Promise.all(productions.map(extractFromProductionPage))
  ).flat()

  return makeScreeningsUniqueAndSorted(
    screenings.filter(({ date }) => date >= now),
  )
}

runIfMain(extractFromMainPage, import.meta.url)

export default extractFromMainPage

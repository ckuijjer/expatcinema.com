import got from 'got'
import { decode } from 'html-entities'
import { DateTime } from 'luxon'

import { logger as parentLogger } from '../powertools'
import { Screening } from '../types'
import { makeScreeningsUniqueAndSorted } from './utils/makeScreeningsUniqueAndSorted'
import { extractScreeningsFromPages } from './utils/extractScreeningsFromPages'
import { titleCase } from './utils/titleCase'
import { createXray } from '../xRay'

const logger = parentLogger.createChild({
  persistentLogAttributes: {
    scraper: 'worm',
  },
})

const xray = createXray({ logger })

const BASE_URL = 'https://worm.org'
const SEARCH_TERM = 'subtitle'

export type SearchResult = {
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
      subtype === 'wp_theatre_prod' &&
      url.startsWith(`${BASE_URL}/production/`),
  )

  logger.debug('search results', {
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
    .filter(({ normalized }) =>
      normalized.toLowerCase().includes('english subtitles'),
    )

  if (metadataParagraphs.length !== 1) {
    return null
  }

  const titleFromMetadata = metadataParagraphs[0].normalized.match(
    /(?<title>.+?)(?:\s*by\s+|\s*Directed by\s+|\s*Dir:\s*).+?\b\d{4}\b/i,
  )?.groups?.title

  const title =
    titleFromMetadata || decode(page.title).replace(/\s+/g, ' ').trim()

  return {
    title: titleCase(title),
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

  logger.debug('production page', { title, url, page })

  if (!hasEnglishSubtitles(page.detailParagraphs)) {
    return []
  }

  const titleAndYear = parseTitleAndYear(page)

  if (!titleAndYear) {
    logger.debug('skipping ambiguous multi-film production', {
      title,
      url,
      page,
    })
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

// The production pages of what is on the agenda from today. The search finds
// 131 productions with "subtitle", most of them past, and fetching all of their
// pages at once got a 429 from worm.org for 108 of them (2026-10-28). The
// agenda is one request and lists only what is still to come, so only those
// pages are fetched. /agenda/film/ gives the same list as /agenda/
const getAgendaUrls = async (): Promise<string[]> => {
  const hrefs: string[] = await xray(`${BASE_URL}/agenda/`, [
    '.agenda-item__link@href',
  ])

  const urls = [
    ...new Set(hrefs.filter((href) => href?.includes('/production/'))),
  ]

  if (urls.length === 0) {
    logger.warn('no productions on the agenda, scraper is probably broken')
  }

  return urls
}

export const onlyOnAgenda = (
  productions: SearchResult[],
  agendaUrls: string[],
) => productions.filter(({ url }) => agendaUrls.includes(url))

const extractFromMainPage = async (): Promise<Screening[]> => {
  const [allProductions, agendaUrls] = await Promise.all([
    getProductionResults(),
    getAgendaUrls(),
  ])
  const productions = onlyOnAgenda(allProductions, agendaUrls)

  logger.info('productions with subtitles on the agenda', {
    withSubtitles: allProductions.length,
    onAgenda: agendaUrls.length,
    both: productions.length,
  })

  const now = DateTime.now().minus({ hours: 1 }).toJSDate()
  const screenings = await extractScreeningsFromPages(
    productions,
    extractFromProductionPage,
    { logger, url: ({ url }) => url, concurrency: 3 },
  )

  return makeScreeningsUniqueAndSorted(
    screenings.filter(({ date }) => date >= now),
  )
}

export default extractFromMainPage

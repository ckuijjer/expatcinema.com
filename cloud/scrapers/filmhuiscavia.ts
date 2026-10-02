import got from 'got'

import { logger as parentLogger } from '../powertools'
import { Screening } from '../types'
import { createXray } from '../xRay'
import { extractScreeningsFromPages } from './utils/extractScreeningsFromPages'
import {
  MONTH_PAGE_URL,
  cleanTitle,
  extractReleaseYear,
  findMetadataLine,
  hasEnglishSubtitles,
  parseDate,
  parseMonthPageUrl,
  splitEntries,
} from './utils/filmhuiscaviaProgramme'
import { makeScreeningsUniqueAndSorted } from './utils/makeScreeningsUniqueAndSorted'
import { runIfMain } from './utils/runIfMain'

const logger = parentLogger.createChild({
  persistentLogAttributes: {
    scraper: 'filmhuiscavia',
  },
})

const xray = createXray({ logger })

// Filmhuis Cavia publishes its programme per month, as one long article per
// month page (/programma/oktober-2026) that is linked from the navigation menu
// of every page; the next month shows up there once it is published. Within a
// month page every screening is an entry separated by <hr id="slug">:
//
//   Donderdag 1 oktober, 20:00
//   <h3>Brazil Unfiltered</h3>
//   <h2>Cabra Marcado Para Morrer</h2>
//   <strong>Eduardo Coutinho | 1984 | Brazil | 119’ | EN subtitles</strong>
//
// The same month page lists every screening of a series, which the series'
// own page does not do reliably, so only month pages are read.
const BASE_URL = 'https://filmhuiscavia.nl'

type XRayFromEntry = {
  paragraphs: string[]
  title: string
  metadata: string[]
}

const extractFromEntry = async (
  entryHtml: string,
  anchor: string | undefined,
  monthPageUrl: string,
  page: { month: number; year: number },
): Promise<Screening[]> => {
  const entry: XRayFromEntry = await xray(entryHtml, {
    paragraphs: ['p | normalizeWhitespace | trim'],
    title: 'h2 | normalizeWhitespace | trim',
    metadata: ['strong | normalizeWhitespace | trim'],
  })

  // The date line is the first paragraph of the entry
  const date = parseDate((entry.paragraphs ?? []).join(' '), page)
  if (!date || !entry.title) return []

  const metadataLine = findMetadataLine(entry.metadata ?? [])
  if (!hasEnglishSubtitles(metadataLine)) return []

  return [
    {
      title: cleanTitle(entry.title),
      year: extractReleaseYear(metadataLine),
      // The entries have no page of their own, link to the entry in the month page
      url: anchor ? `${monthPageUrl}#${anchor}` : monthPageUrl,
      cinema: 'Filmhuis Cavia',
      date,
    },
  ]
}

export const extractScreeningsFromMonthHtml = async (
  html: string,
  monthPageUrl: string,
): Promise<Screening[]> => {
  const page = parseMonthPageUrl(monthPageUrl)
  if (!page) throw new Error(`Not a Filmhuis Cavia month page: ${monthPageUrl}`)

  const entries = splitEntries(html)

  const screenings = await Promise.all(
    entries.map(({ anchor, html }) =>
      extractFromEntry(html, anchor, monthPageUrl, page),
    ),
  )

  return screenings.flat()
}

const extractFromMonthPage = async (url: string) =>
  extractScreeningsFromMonthHtml(await got(url).text(), url)

const extractFromMainPage = async (): Promise<Screening[]> => {
  const links: string[] = await xray(BASE_URL, ['a@href'])

  const monthPageUrls = Array.from(
    new Set(links.filter((link) => MONTH_PAGE_URL.test(link))),
  )

  logger.debug('month pages', { monthPageUrls })

  if (monthPageUrls.length === 0) {
    logger.warn('no month pages found in the navigation menu')
  }

  const screenings = await extractScreeningsFromPages(
    monthPageUrls,
    extractFromMonthPage,
    { logger },
  )

  logger.debug('screenings', { screenings })

  return makeScreeningsUniqueAndSorted(screenings)
}

runIfMain(extractFromMainPage, import.meta.url)

export default extractFromMainPage

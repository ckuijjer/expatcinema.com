import got from 'got'
import { DateTime } from 'luxon'

import { logger as parentLogger } from '../powertools'
import { Screening } from '../types'
import { createXray } from '../xRay'
import { extractScreeningsFromPages } from './utils/extractScreeningsFromPages'
import { makeScreeningsUniqueAndSorted } from './utils/makeScreeningsUniqueAndSorted'
import { fullMonthToNumberDutch } from './utils/monthToNumber'
import { removeYearSuffix } from './utils/removeYearSuffix'
import { splitTime } from './utils/splitTime'
import { titleCase } from './utils/titleCase'

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

const MONTH_PAGE_URL =
  /^https:\/\/filmhuiscavia\.nl\/programma\/(januari|februari|maart|april|mei|juni|juli|augustus|september|oktober|november|december)-(\d{4})\/?$/i

const DATE_TEXT =
  /(?:maandag|dinsdag|woensdag|donderdag|vrijdag|zaterdag|zondag)\s+(\d{1,2})\s+([a-z]+),?\s+(\d{1,2}[:.]\d{2})/i

export const parseMonthPageUrl = (url: string) => {
  const match = url.match(MONTH_PAGE_URL)
  if (!match) return undefined

  return {
    month: fullMonthToNumberDutch(match[1]),
    year: Number(match[2]),
  }
}

// The month page only says "Donderdag 1 oktober"; its URL has the year. An
// entry can also belong to a neighbouring month (a December page listing 2 January).
export const parseDate = (
  text: string,
  page: { month: number; year: number },
) => {
  const match = text.match(DATE_TEXT)
  if (!match) return undefined

  const day = Number(match[1])
  const month = fullMonthToNumberDutch(match[2])
  const [hour, minute] = splitTime(match[3])

  let year = page.year
  if (month - page.month > 6) year -= 1
  if (month - page.month < -6) year += 1

  const date = DateTime.fromObject(
    { year, month, day, hour, minute },
    { zone: 'Europe/Amsterdam' },
  )

  return date.isValid ? date.toJSDate() : undefined
}

// e.g. "Eduardo Coutinho | 1984 | Brazil | 119’ | EN subtitles". Silent films
// and films without dialogue say so there instead, and some entries have no
// such line at all; neither has English subtitles.
export const findMetadataLine = (metadata: string[]) =>
  metadata.find((line) => line.includes('|'))

export const hasEnglishSubtitles = (metadataLine?: string) =>
  /\b(?:EN|English) subtitles\b/i.test(metadataLine ?? '')

export const extractReleaseYear = (metadataLine?: string) => {
  const year = (metadataLine ?? '')
    .split('|')
    .map((field) => field.trim())
    .find((field) => /^(?:19|20)\d{2}$/.test(field))

  return year ? Number(year) : undefined
}

// Drop add-ons to the film title, e.g. "Azart – Come Make Art + Q&A",
// "Ménilmontant with live score by Kadavergraver" and
// "Looking Back – by Porn Film Festival Amsterdam"
export const cleanTitle = (title: string) =>
  titleCase(
    removeYearSuffix(
      title
        .replace(/\s+\+\s+.*$/, '')
        .replace(/\s+with live score\b.*$/i, '')
        .replace(/\s+[–-]\s+by\s+.*$/i, '')
        .replace(/\s+at\s+Nassaukerk$/i, '')
        .trim(),
    ),
  )

// A month page is one article; every screening is an entry separated by
// <hr id="slug">. Returns [{ anchor: 'slug', html: '<entry html>' }, ...]; the
// intro before the first <hr> is skipped, and the last entry runs into the footer.
export const splitEntries = (html: string) => {
  // [intro, <hr>, entry, <hr>, entry, ...]
  const parts = html.split(/(<hr[^>]*>)/i)

  const entries: { anchor?: string; html: string }[] = []
  for (let i = 1; i < parts.length; i += 2) {
    entries.push({
      anchor: parts[i].match(/\sid="([^"]+)"/i)?.[1],
      html: parts[i + 1] ?? '',
    })
  }

  return entries
}

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

export default extractFromMainPage

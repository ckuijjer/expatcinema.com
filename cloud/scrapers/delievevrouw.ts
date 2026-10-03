import { DateTime } from 'luxon'

import { logger as parentLogger } from '../powertools'
import { Screening } from '../types'
import { createXray } from '../xRay'
import { extractScreeningsFromPages } from './utils/extractScreeningsFromPages'
import { makeScreeningsUniqueAndSorted } from './utils/makeScreeningsUniqueAndSorted'
import { removeYearSuffix } from './utils/removeYearSuffix'
import { titleCase } from './utils/titleCase'

const logger = parentLogger.createChild({
  persistentLogAttributes: {
    scraper: 'delievevrouw',
  },
})

const xray = createXray({ logger })

// De Lieve Vrouw (Amersfoort) lists its programme, films and theatre mixed, on
// /agenda, a week per page (/agenda?page=2, ...). Every event has its own page
// with
//
//   <ul class="event-tags"><li>Movies that Matter</li><li>Engels ondertiteld</li></ul>
//   <table class="event-table"><tr><th>Land</th><td>Noorwegen, Nederland, 2025</td></tr>...
//   one JSON-LD block per showtime, with a startDate like 2026-10-03T16:25:00.0000000
//
// Only events tagged "Engels ondertiteld" are screenings we want; most weeks
// there are none. The sitemap isn't used, it also lists every past event.
const BASE_URL = 'https://lievevrouw.nl'
const AGENDA_URL = `${BASE_URL}/agenda`

const AGENDA_PAGE_URL = /^https:\/\/lievevrouw\.nl\/agenda\?page=(\d+)/
const EVENT_URL = /^https:\/\/lievevrouw\.nl\/agenda\/([^/?#]+)\/?$/
// Overview pages that live under /agenda/ as well
const CATEGORY_SLUGS = new Set([
  'film',
  'theater',
  'specials',
  'nieuwe-filmreleases',
  'koop-kaarten',
])

export const isEventUrl = (url: string) => {
  const slug = url.match(EVENT_URL)?.[1]

  return slug !== undefined && !CATEGORY_SLUGS.has(slug)
}

// The pagination only links a few pages, with the last one included
export const getLastAgendaPage = (links: string[]) =>
  Math.max(
    1,
    ...links.map((link) => Number(link.match(AGENDA_PAGE_URL)?.[1] ?? 0)),
  )

export const hasEnglishSubtitles = (tags: string[]) =>
  tags.some((tag) => /^Engels ondertiteld$/i.test(tag))

type EventDetail = { label: string; value: string }

// The Land field looks like "Noorwegen, Nederland, 2025"
export const extractReleaseYear = (details: EventDetail[]) => {
  const year = details
    .find(({ label }) => label === 'Land')
    ?.value.split(',')
    .map((field) => field.trim())
    .find((field) => /^(?:19|20)\d{2}$/.test(field))

  return year ? Number(year) : undefined
}

// Drop add-ons to the title, e.g. "Bromens | ICOON", "Banger dan ik (7+)",
// "Akira (re-release)" and "CTRL_DLV: Possession"
export const cleanTitle = (title: string) =>
  titleCase(
    removeYearSuffix(
      title
        .replace(/\s+\|\s+.*$/, '')
        .replace(/\s+\(\d+\+\)$/, '')
        .replace(/\s+\(re-release\)$/i, '')
        .replace(/^CTRL_DLV:\s+/i, '')
        .trim(),
    ),
  )

// A JSON-LD block is a single object, a list of them, or an object with an
// @graph; showtimes are the ones with a startDate, like
// "2026-10-03T16:25:00.0000000" (Amsterdam time, without an offset)
export const extractShowtimes = (jsonLd: string[]): Date[] =>
  jsonLd.flatMap((json) => {
    let data: unknown
    try {
      data = JSON.parse(json)
    } catch (error) {
      logger.warn('skipping unparsable JSON-LD', { error })
      return []
    }

    const items: unknown[] = Array.isArray(data)
      ? data
      : [data, ...((data as { '@graph'?: unknown[] } | null)?.['@graph'] ?? [])]

    return items.flatMap((item) => {
      const startDate = (item as { startDate?: unknown } | null)?.startDate
      if (typeof startDate !== 'string') return []

      const date = DateTime.fromISO(startDate.slice(0, 19), {
        zone: 'Europe/Amsterdam',
      })
      if (!date.isValid) {
        logger.warn('skipping showtime with an unknown date', { startDate })
        return []
      }

      return [date.toJSDate()]
    })
  })

type XRayFromEventPage = {
  title: string
  tags: string[]
  details: EventDetail[]
  jsonLd: string[]
}

// `source` is the URL of the event page, or its HTML (x-ray takes both)
export const extractScreeningsFromEvent = async (
  source: string,
  url: string,
): Promise<Screening[]> => {
  const event: XRayFromEventPage = await xray(source, {
    title: 'h1 | normalizeWhitespace | trim',
    tags: ['ul.event-tags li | normalizeWhitespace | trim'],
    details: xray('table.event-table tr', [
      {
        label: 'th | normalizeWhitespace | trim',
        value: 'td | normalizeWhitespace | trim',
      },
    ]),
    jsonLd: ['script[type="application/ld+json"]'],
  })

  if (!hasEnglishSubtitles(event.tags ?? [])) return []

  if (!event.title) {
    logger.warn('skipping event with English subtitles without a title', {
      url,
    })
    return []
  }

  const dates = extractShowtimes(event.jsonLd ?? [])
  if (dates.length === 0) {
    logger.warn('skipping event with English subtitles without showtimes', {
      url,
    })
  }

  return dates.map((date) => ({
    title: cleanTitle(event.title),
    year: extractReleaseYear(event.details ?? []),
    url,
    cinema: 'De Lieve Vrouw',
    date,
  }))
}

const extractFromEventPage = async (url: string) =>
  extractScreeningsFromEvent(url, url)

const extractEventUrlsFromAgendaPage = async (url: string) => {
  const links: string[] = await xray(url, ['a@href'])

  return links.filter(isEventUrl)
}

const extractFromMainPage = async (): Promise<Screening[]> => {
  const links: string[] = await xray(AGENDA_URL, ['a@href'])
  const lastPage = getLastAgendaPage(links)

  const otherPages = await Promise.allSettled(
    Array.from(
      { length: lastPage - 1 },
      (_, index) => `${AGENDA_URL}?page=${index + 2}`,
    ).map(extractEventUrlsFromAgendaPage),
  )

  otherPages.forEach((result, index) => {
    if (result.status === 'rejected') {
      logger.warn('failed to read an agenda page', {
        page: index + 2,
        error: result.reason,
      })
    }
  })

  const eventUrls = Array.from(
    new Set([
      ...links.filter(isEventUrl),
      ...otherPages.flatMap((result) =>
        result.status === 'fulfilled' ? result.value : [],
      ),
    ]),
  )

  logger.debug('event pages', { lastPage, eventUrls })

  if (eventUrls.length === 0) {
    logger.warn('no events found on the agenda')
  }

  const screenings = await extractScreeningsFromPages(
    eventUrls,
    extractFromEventPage,
    { logger },
  )

  logger.debug('screenings', { screenings })

  return makeScreeningsUniqueAndSorted(screenings)
}

export default extractFromMainPage

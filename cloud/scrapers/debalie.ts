import got from 'got'
import { DateTime } from 'luxon'
import Xray from 'x-ray'

import { logger as parentLogger } from '../powertools'
import { Screening } from '../types'
import { makeScreeningsUniqueAndSorted } from './utils/makeScreeningsUniqueAndSorted'
import { monthToNumber } from './utils/monthToNumber'
import { runIfMain } from './utils/runIfMain'
import { splitTime } from './utils/splitTime'
import { titleCase } from './utils/titleCase'
import { trim } from './utils/xrayFilters'

const logger = parentLogger.createChild({
  persistentLogAttributes: {
    scraper: 'debalie',
  },
})

const xray = Xray({
  filters: {
    trim,
    normalizeWhitespace: (value) =>
      typeof value === 'string' ? value.replace(/\s+/g, ' ') : value,
  },
})

const extractDetailUrlsFromSitemap = (xml: string) =>
  Array.from(
    new Set(
      Array.from(
        xml.matchAll(/<loc>(https:\/\/debalie\.nl\/cinema\/[^<]+)<\/loc>/g),
      ).map((match) => match[1]),
    ),
  )

const hasEnglishSubtitles = (html: string) =>
  /with English subtitles|NL,\s*ENG/i.test(html)

const extractTitle = (title: string) => {
  const match = title.match(/(.*?)(?:,\s*een film in De Balie|\s*-\s*De Balie)?$/i)
  return match?.[1] ? titleCase(match[1].trim()) : null
}

const extractPageYear = (html: string) => {
  const match = html.match(/"datePublished":"(\d{4})-\d{2}-\d{2}/)
  return match?.[1] ? Number(match[1]) : DateTime.now().year
}

const parseTicketDateFromTicketUrl = (url: string, time: string, year: number) => {
  const match = url.match(/-(\d{1,2})-([a-z]{3})-\d+\/?$/i)
  if (!match) return null

  const day = Number(match[1])
  const month = monthToNumber(match[2])
  const [hour, minute] = splitTime(time)

  return DateTime.fromObject({
    year,
    month,
    day,
    hour,
    minute,
  }).toJSDate()
}

const parseTicketDateFromSelectorDay = (selectorDay: string, time: string) => {
  if (!/^\d{8}$/.test(selectorDay)) return null

  return DateTime.fromFormat(
    `${selectorDay} ${time}`,
    'yyyyLLdd HH:mm',
    { zone: 'Europe/Amsterdam' },
  ).toJSDate()
}

type XRayDetailPage = {
  bodyText: string
  tickets: {
    selectorDay?: string
    url: string
    time: string
  }[]
  title: string
}

const extractTicketLinks = (page: XRayDetailPage) =>
  page.tickets.flatMap(({ url, selectorDay, time }) => {
    if (!url || !time) {
      return []
    }

    return [
      {
        url: new URL(url, 'https://debalie.nl').toString(),
        selectorDay: selectorDay ?? null,
        time,
      },
    ]
  })

const extractScreeningDate = (
  url: string,
  selectorDay: string | null,
  time: string,
  year: number,
) =>
  selectorDay
    ? parseTicketDateFromSelectorDay(selectorDay, time)
    : parseTicketDateFromTicketUrl(url, time, year)

const extractFromDetailPage = async (url: string): Promise<Screening[]> => {
  let html: string
  try {
    html = await got(url).text()
  } catch (error) {
    logger.warn('skipping page that could not be fetched', { url, error })
    return []
  }

  const page: XRayDetailPage = await xray(html, {
    bodyText: 'body@text | normalizeWhitespace | trim',
    tickets: xray('[data-ticket-selector-day]', [
      {
        selectorDay: '@data-ticket-selector-day | trim',
        url: '.banner-bar__link@href | trim',
        time: '.banner-bar__link | trim',
      },
    ]),
    title: 'title | trim',
  })

  if (!hasEnglishSubtitles(page.bodyText)) {
    return []
  }

  const title = extractTitle(page.title)
  if (!title) return []
  const year = extractPageYear(html)

  const ticketLinks = extractTicketLinks(page)
  if (ticketLinks.length === 0) {
    return []
  }

  return ticketLinks
    .map(({ url: ticketUrl, selectorDay, time }) => ({
      title,
      url,
      cinema: 'De Balie',
      date: extractScreeningDate(ticketUrl, selectorDay, time, year),
    }))
    .filter((screening): screening is Screening => screening.date !== null)
}

const extractFromMainPage = async (): Promise<Screening[]> => {
  const sitemapXml = await got('https://debalie.nl/vo-cinema-sitemap.xml').text()
  const urls = extractDetailUrlsFromSitemap(sitemapXml)

  logger.info('detail urls', { numberOfUrls: urls.length })

  const screenings = (await Promise.all(urls.map(extractFromDetailPage))).flat()

  return makeScreeningsUniqueAndSorted(screenings)
}

runIfMain(extractFromMainPage, import.meta.url)

export default extractFromMainPage

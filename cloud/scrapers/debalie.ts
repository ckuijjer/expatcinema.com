import got from 'got'
import { decode } from 'html-entities'
import { DateTime } from 'luxon'

import { logger as parentLogger } from '../powertools'
import { Screening } from '../types'
import { makeScreeningsUniqueAndSorted } from './utils/makeScreeningsUniqueAndSorted'
import { monthToNumber } from './utils/monthToNumber'
import { runIfMain } from './utils/runIfMain'
import { splitTime } from './utils/splitTime'
import { titleCase } from './utils/titleCase'

const logger = parentLogger.createChild({
  persistentLogAttributes: {
    scraper: 'debalie',
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

const extractTitle = (html: string) => {
  const match = html.match(/<title>(.*?)(?:,\s*een film in De Balie|\s*-\s*De Balie)<\/title>/i)
  return match?.[1] ? titleCase(decode(match[1].trim())) : null
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

const extractTicketLinks = (html: string) =>
  [
    ...Array.from(
      html.matchAll(
        /data-ticket-selector-day="(\d{8})"[\s\S]*?<a href="([^"]+)"\s+class="button button--tertiary button--ticket-icon banner-bar__link">\s*(\d{1,2}:\d{2})\s*<\/a>/gi,
      ),
    ).map((match) => ({
      url: new URL(match[2], 'https://debalie.nl').toString(),
      selectorDay: match[1],
      time: match[3],
    })),
    ...Array.from(
      html.matchAll(
        /<a href="(https:\/\/tickets\.debalie\.nl\/[^"]+)"\s+target="_blank"\s+class="button button--tertiary button--ticket-icon banner-bar__link">\s*(\d{1,2}:\d{2})\s*<\/a>/gi,
      ),
    ).map((match) => ({
      url: match[1],
      selectorDay: null,
      time: match[2],
    })),
  ]

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

  if (!hasEnglishSubtitles(html)) {
    return []
  }

  const title = extractTitle(html)
  if (!title) return []
  const year = extractPageYear(html)

  return extractTicketLinks(html)
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

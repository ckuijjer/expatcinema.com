import got from 'got'
import { decode } from 'html-entities'
import { DateTime } from 'luxon'

import { logger as parentLogger } from '../powertools'
import { Screening } from '../types'
import { makeScreeningsUniqueAndSorted } from './utils/makeScreeningsUniqueAndSorted'
import { runIfMain } from './utils/runIfMain'
import { titleCase } from './utils/titleCase'

const logger = parentLogger.createChild({
  persistentLogAttributes: {
    scraper: 'castellum',
  },
})

const extractUrlsFromSitemap = (xml: string) =>
  Array.from(xml.matchAll(/<loc>(https:\/\/www\.alphens\.nl\/evenement\/[^<]+)<\/loc>/g))
    .map((match) => match[1])
    .filter(Boolean)

const hasEnglishSubtitles = (html: string) =>
  /Engelse ondertitels|English subtitles/i.test(html)

const isCastellumVenue = (html: string) =>
  /Castellum Theater & Film/i.test(html)

const extractTitle = (html: string) => {
  const match = html.match(/<h1 class="h2">([\s\S]*?)<\/h1>/i)
  return match?.[1] ? titleCase(decode(match[1].replace(/<[^>]+>/g, '').trim())) : null
}

const extractStartDate = (html: string) => {
  const match = html.match(/"startDate":\s*"([^"]+)"/)
  if (!match?.[1]) return null

  return DateTime.fromISO(match[1], { zone: 'Europe/Amsterdam' }).toJSDate()
}

const extractFromEventPage = async (url: string): Promise<Screening[]> => {
  let html: string
  try {
    html = await got(url).text()
  } catch (error) {
    logger.warn('skipping page that could not be fetched', { url, error })
    return []
  }

  if (!isCastellumVenue(html) || !hasEnglishSubtitles(html)) {
    return []
  }

  const title = extractTitle(html)
  const date = extractStartDate(html)

  if (!title || !date) {
    logger.warn('skipping page with missing title or date', { url })
    return []
  }

  return [
    {
      title,
      url,
      cinema: 'Castellum Theater & Film',
      date,
    },
  ]
}

const extractFromMainPage = async (): Promise<Screening[]> => {
  const sitemapXml = await got('https://www.alphens.nl/rss/google.agenda.rss').text()
  const urls = extractUrlsFromSitemap(sitemapXml)

  logger.info('sitemap urls', { numberOfUrls: urls.length })

  const screenings = (await Promise.all(urls.map(extractFromEventPage))).flat()

  return makeScreeningsUniqueAndSorted(screenings)
}

runIfMain(extractFromMainPage, import.meta.url)

export default extractFromMainPage

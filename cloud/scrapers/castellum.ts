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
    scraper: 'castellum',
  },
})

const xray = Xray({ filters: { trim } })

const extractUrlsFromSitemap = (xml: string) =>
  Array.from(xml.matchAll(/<loc>(https:\/\/www\.alphens\.nl\/evenement\/[^<]+)<\/loc>/g))
    .map((match) => match[1])
    .filter(Boolean)

const hasEnglishSubtitles = (html: string) =>
  /Engelse ondertitels|English subtitles/i.test(html)

const isCastellumVenue = (html: string) =>
  /Castellum Theater & Film/i.test(html)

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

  const { h1Title } = await xray(html, { h1Title: 'h1.h2 | trim' })
  const title = h1Title ? titleCase(h1Title) : null
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

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
    scraper: 'cinemathepulse',
  },
})

const xray = Xray({
  filters: {
    trim,
    normalizeWhitespace: (value) =>
      typeof value === 'string' ? value.replace(/\s+/g, ' ') : value,
  },
})

const extractFilmUrls = (xml: string) =>
  Array.from(
    new Set(
      Array.from(
        xml.matchAll(/<loc>(https:\/\/www\.cinemathepulse\.com\/films\/[^<]+)<\/loc>/g),
      ).map((match) => match[1]),
    ),
  )

const hasEnglishSubtitles = (text: string) =>
  /We show this film also with English subtitles/i.test(text)

type XRayPage = {
  bodyText: string
  h1Title: string
}

const extractScreeningDates = (text: string): Date[] =>
  Array.from(
    text.matchAll(/(\d{1,2}\/\d{1,2}\/\d{4})\s+(\d{1,2}:\d{2}\s+(?:AM|PM))/gi),
  )
    .map(([, dateStr, timeStr]) => {
      const dt = DateTime.fromFormat(`${dateStr} ${timeStr}`, 'M/d/yyyy h:mm a', {
        zone: 'Europe/Amsterdam',
      })
      return dt.isValid ? dt.toJSDate() : null
    })
    .filter((d): d is Date => d !== null)

const extractFromFilmPage = async (url: string): Promise<Screening[]> => {
  let html: string
  try {
    html = await got(url).text()
  } catch (error) {
    logger.warn('skipping page that could not be fetched', { url, error })
    return []
  }

  const page: XRayPage = await xray(html, {
    bodyText: 'body@text | normalizeWhitespace | trim',
    h1Title: 'h1 | trim',
  })

  if (!hasEnglishSubtitles(page.bodyText)) {
    return []
  }

  const title = page.h1Title ? titleCase(page.h1Title) : null
  if (!title) {
    logger.warn('skipping page with missing title', { url })
    return []
  }

  const dates = extractScreeningDates(page.bodyText)
  if (dates.length === 0) {
    logger.warn('skipping page with no screening dates', { url })
    return []
  }

  return dates.map((date) => ({
    title,
    url,
    cinema: 'Cinema The Pulse',
    date,
  }))
}

const extractFromMainPage = async (): Promise<Screening[]> => {
  const sitemapXml = await got('https://www.cinemathepulse.com/sitemap.xml').text()
  const urls = extractFilmUrls(sitemapXml)

  logger.info('film urls', { numberOfUrls: urls.length })

  const screenings = (await Promise.all(urls.map(extractFromFilmPage))).flat()

  return makeScreeningsUniqueAndSorted(screenings)
}

runIfMain(extractFromMainPage, import.meta.url)

export default extractFromMainPage

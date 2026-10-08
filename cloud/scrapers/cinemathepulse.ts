import got from 'got'
import { DateTime } from 'luxon'

import { logger as parentLogger } from '../powertools'
import { Screening } from '../types'
import { makeScreeningsUniqueAndSorted } from './utils/makeScreeningsUniqueAndSorted'
import { titleCase } from './utils/titleCase'
import { createXray } from '../xRay'

const logger = parentLogger.createChild({
  persistentLogAttributes: {
    scraper: 'cinemathepulse',
  },
})

const xray = createXray({ logger })

// Only pages with "englishsubtitles" (formerly "withEngsubtitles") in the URL
// are English subtitle screenings. These are separate Webflow CMS items for
// the same film.
const extractEngFilmUrls = (xml: string) =>
  Array.from(
    new Set(
      Array.from(
        xml.matchAll(
          /<loc>(https:\/\/www\.cinemathepulse\.com\/films\/[^<]*(?:withEng|english)subtitles[^<]*)<\/loc>/gi,
        ),
      ).map((match) => match[1]),
    ),
  )

// The film page shows the production year next to the title, in separate
// elements: <h2 class="heading-style-film-year">(</h2>
// <h2 ...>1988</h2><h2 ...>)</h2>, e.g. Akira -> "(1988)".
export const extractYear = (parts: string[] = []) => {
  const year = parts.join('').match(/^\s*\(?\s*(\d{4})\s*\)?\s*$/)?.[1]

  return year &&
    Number(year) >= 1888 &&
    Number(year) <= new Date().getFullYear() + 2
    ? Number(year)
    : undefined
}

type XRayPage = {
  h1Title: string
  yearParts: string[]
  dateSyncs: string[]
}

const extractFromFilmPage = async (url: string): Promise<Screening[]> => {
  let html: string
  try {
    html = await got(url).text()
  } catch (error) {
    logger.warn('skipping page that could not be fetched', { url, error })
    return []
  }

  const page: XRayPage = await xray(html, {
    h1Title: 'h1.heading-style-film-titles | trim',
    yearParts: ['.heading-style-film-year | trim'],
    dateSyncs: ['.shows_date_sync | trim'],
  })

  const title = page.h1Title
    ? titleCase(page.h1Title.replace(/\s*\(english subtitles\)$/i, ''))
    : null
  if (!title) {
    logger.warn('skipping page with missing title', { url })
    return []
  }

  const year = extractYear(page.yearParts)

  const dates = page.dateSyncs
    .map((dateSync) => {
      const dt = DateTime.fromFormat(dateSync, 'M/d/yyyy h:mm a', {
        zone: 'Europe/Amsterdam',
      })
      return dt.isValid ? dt.toJSDate() : null
    })
    .filter((d): d is Date => d !== null)

  if (dates.length === 0) {
    logger.warn('skipping page with no screening dates', { url })
    return []
  }

  return dates.map((date) => ({
    title,
    year,
    url,
    cinema: 'Cinema The Pulse',
    date,
  }))
}

const extractFromMainPage = async (): Promise<Screening[]> => {
  const sitemapXml = await got(
    'https://www.cinemathepulse.com/sitemap.xml',
  ).text()
  const urls = extractEngFilmUrls(sitemapXml)

  logger.info('english subtitle film urls', { numberOfUrls: urls.length })

  const screenings = (await Promise.all(urls.map(extractFromFilmPage))).flat()

  return makeScreeningsUniqueAndSorted(screenings)
}

export default extractFromMainPage

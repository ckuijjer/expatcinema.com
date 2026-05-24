import got from 'got'
import { DateTime } from 'luxon'

import { logger as parentLogger } from '../powertools'
import { Screening } from '../types'
import { makeScreeningsUniqueAndSorted } from './utils/makeScreeningsUniqueAndSorted'
import { runIfMain } from './utils/runIfMain'
import { titleCase } from './utils/titleCase'
import { createXray } from '../xRay'

const logger = parentLogger.createChild({
  persistentLogAttributes: {
    scraper: 'cinemathepulse',
  },
})

const xray = createXray({ logger })

// Only pages with withEngsubtitles in the URL are English subtitle screenings.
// These are separate Webflow CMS items for the same film.
const extractEngFilmUrls = (xml: string) =>
  Array.from(
    new Set(
      Array.from(
        xml.matchAll(/<loc>(https:\/\/www\.cinemathepulse\.com\/films\/[^<]*withEngsubtitles[^<]*)<\/loc>/g),
      ).map((match) => match[1]),
    ),
  )

type XRayPage = {
  h1Title: string
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
    dateSyncs: ['.shows_date_sync | trim'],
  })

  const title = page.h1Title ? titleCase(page.h1Title) : null
  if (!title) {
    logger.warn('skipping page with missing title', { url })
    return []
  }

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
    url,
    cinema: 'Cinema The Pulse',
    date,
  }))
}

const extractFromMainPage = async (): Promise<Screening[]> => {
  const sitemapXml = await got('https://www.cinemathepulse.com/sitemap.xml').text()
  const urls = extractEngFilmUrls(sitemapXml)

  logger.info('english subtitle film urls', { numberOfUrls: urls.length })

  const screenings = (await Promise.all(urls.map(extractFromFilmPage))).flat()

  return makeScreeningsUniqueAndSorted(screenings)
}

runIfMain(extractFromMainPage, import.meta.url)

export default extractFromMainPage

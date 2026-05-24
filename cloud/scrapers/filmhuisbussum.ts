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
    scraper: 'filmhuisbussum',
  },
})

const xray = createXray({ logger })

const CATEGORY_SLUGS = new Set([
  'koop-ticket',
  'specials',
  'junior',
  'sneak-preview',
  'klassiekers',
])

const extractProgrammaUrls = (xml: string) =>
  Array.from(
    new Set(
      Array.from(
        xml.matchAll(
          /<loc>(https:\/\/www\.filmhuisbussum\.nl\/programma\/([^/<]+))<\/loc>/g,
        ),
      )
        .filter(([, , slug]) => !CATEGORY_SLUGS.has(slug))
        .map(([, url]) => url),
    ),
  )

const hasEnglishSubtitles = (text: string) => /Ondertiteling\s+(English|Engels)/i.test(text)

type XRayPage = {
  bodyText: string
  h1Title: string
}

const extractTitle = (page: XRayPage) => {
  const cleaned = page.h1Title
    .replace(/\s*\((?:english subtitles|english|english subs)[^)]*\)\s*$/i, '')
    .trim()
  return cleaned ? titleCase(cleaned) : null
}

const extractScreeningDates = (text: string): Date[] =>
  Array.from(
    text.matchAll(
      /(maandag|dinsdag|woensdag|donderdag|vrijdag|zaterdag|zondag)\s+(\d{1,2}-\d{2}-\d{4}).*?(\d{2}:\d{2})/gi,
    ),
  )
    .map(([, , dateStr, timeStr]) => {
      const dt = DateTime.fromFormat(`${dateStr} ${timeStr}`, 'd-MM-yyyy HH:mm', {
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
    h1Title: 'h2.title | trim',
  })

  if (!hasEnglishSubtitles(page.bodyText)) {
    return []
  }

  const title = extractTitle(page)
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
    cinema: 'Filmhuis Bussum',
    date,
  }))
}

const extractFromMainPage = async (): Promise<Screening[]> => {
  const sitemapXml = await got('https://www.filmhuisbussum.nl/sitemap.xml').text()
  const urls = extractProgrammaUrls(sitemapXml)

  logger.info('programme urls', { numberOfUrls: urls.length })

  const screenings = (await Promise.all(urls.map(extractFromFilmPage))).flat()

  return makeScreeningsUniqueAndSorted(screenings)
}

runIfMain(extractFromMainPage, import.meta.url)

export default extractFromMainPage

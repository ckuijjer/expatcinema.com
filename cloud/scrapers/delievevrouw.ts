import got from 'got'
import { DateTime } from 'luxon'
import Xray from 'x-ray'

import { logger as parentLogger } from '../powertools'
import { Screening } from '../types'
import { makeScreeningsUniqueAndSorted } from './utils/makeScreeningsUniqueAndSorted'
import { shortMonthToNumberDutch } from './utils/monthToNumber'
import { runIfMain } from './utils/runIfMain'
import { splitTime } from './utils/splitTime'
import { titleCase } from './utils/titleCase'
import { trim } from './utils/xrayFilters'

const logger = parentLogger.createChild({
  persistentLogAttributes: {
    scraper: 'delievevrouw',
  },
})

const xray = Xray({
  filters: {
    trim,
    normalizeWhitespace: (value) =>
      typeof value === 'string' ? value.replace(/\s+/g, ' ') : value,
  },
})

const CATEGORY_SLUGS = new Set([
  'koop-kaarten',
  'film',
  'theater',
  'specials',
  'nieuwe-filmreleases',
])

const extractAgendaUrls = (xml: string) =>
  Array.from(
    new Set(
      Array.from(
        xml.matchAll(/<loc>(https:\/\/lievevrouw\.nl\/agenda\/([^/<]+))<\/loc>/g),
      )
        .filter(([, , slug]) => !CATEGORY_SLUGS.has(slug))
        .map(([, url]) => url),
    ),
  )

const hasEnglishSubtitles = (text: string) =>
  /Engels ondertiteld|Engelse ondertiteling/i.test(text)

type XRayPage = {
  bodyText: string
  h1Title: string
}

const inferYear = (month: number, day: number) => {
  const now = DateTime.now()
  const candidate = DateTime.fromObject({ year: now.year, month, day })
  return candidate < now.minus({ days: 30 }) ? now.year + 1 : now.year
}

const extractScreeningDates = (text: string): Date[] =>
  Array.from(
    text.matchAll(
      /\b(ma|di|wo|do|vr|za|zo)\s+(\d{1,2})\s+(jan|feb|mrt|apr|mei|jun|jul|aug|sep|okt|nov|dec)\s+\[(\d{1,2}:\d{2})\]/gi,
    ),
  )
    .map(([, , dayStr, monthStr, timeStr]) => {
      const day = Number(dayStr)
      const month = shortMonthToNumberDutch(monthStr)
      const [hour, minute] = splitTime(timeStr)
      const year = inferYear(month, day)

      const dt = DateTime.fromObject({ year, month, day, hour, minute }, { zone: 'Europe/Amsterdam' })
      return dt.isValid ? dt.toJSDate() : null
    })
    .filter((d): d is Date => d !== null)

const extractFromAgendaPage = async (url: string): Promise<Screening[]> => {
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
    cinema: 'De Lieve Vrouw',
    date,
  }))
}

const extractFromMainPage = async (): Promise<Screening[]> => {
  const sitemapXml = await got('https://lievevrouw.nl/sitemap.xml').text()
  const urls = extractAgendaUrls(sitemapXml)

  logger.info('agenda urls', { numberOfUrls: urls.length })

  const screenings = (await Promise.all(urls.map(extractFromAgendaPage))).flat()

  return makeScreeningsUniqueAndSorted(screenings)
}

runIfMain(extractFromMainPage, import.meta.url)

export default extractFromMainPage

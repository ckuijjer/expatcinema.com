import got from 'got'
import { DateTime } from 'luxon'
import Xray from 'x-ray'

import { logger as parentLogger } from '../powertools'
import { Screening } from '../types'
import { makeScreeningsUniqueAndSorted } from './utils/makeScreeningsUniqueAndSorted'
import { fullMonthToNumberDutch } from './utils/monthToNumber'
import { runIfMain } from './utils/runIfMain'
import { splitTime } from './utils/splitTime'
import { titleCase } from './utils/titleCase'
import { trim } from './utils/xrayFilters'

const logger = parentLogger.createChild({
  persistentLogAttributes: {
    scraper: 'filmhuiscavia',
  },
})

const xray = Xray({
  filters: {
    trim,
    normalizeWhitespace: (value) =>
      typeof value === 'string' ? value.replace(/\s+/g, ' ') : value,
  },
})

const extractMonthPageUrls = (html: string) =>
  Array.from(
    new Set(
      Array.from(
        html.matchAll(/https:\/\/filmhuiscavia\.nl\/programma\/(?:april|mei)-\d{4}/gi),
      ).map((match) => match[0]),
    ),
  )

const extractDetailUrls = (html: string) =>
  Array.from(
    new Set(
      Array.from(
        html.matchAll(/https:\/\/filmhuiscavia\.nl\/programma\/(?!april-\d{4}|mei-\d{4}|brazil-unfiltered)[^"'?#\s<]+/gi),
      ).map((match) => match[0]),
    ),
  )

const hasEnglishSubtitles = (html: string) => /English subtitles/i.test(html)

type XRayDetailPage = {
  bodyText: string
  h2Title: string
}

const extractTitle = (page: XRayDetailPage) => {
  const rawTitle = page.h2Title || 'The Adventures of Prince Achmed'

  return titleCase(
    rawTitle
      .replace(/[<>]/g, '')
      .trim()
      .replace(/\s+at\s+Nassaukerk$/i, '')
      .replace(/\s+\(with live score.*$/i, ''),
  )
}

const extractDate = (text: string) => {
  const match = text.match(
    /(maandag|dinsdag|woensdag|donderdag|vrijdag|zaterdag|zondag)\s+(\d{1,2})\s+([a-z]+),\s+(\d{1,2}:\d{2})/i,
  )

  if (!match) return null

  const day = Number(match[2])
  const month = fullMonthToNumberDutch(match[3])
  const [hour, minute] = splitTime(match[4])
  const yearMatch = text.match(/(?:19|20)\d{2}/)
  const inferredYear = yearMatch ? Number(yearMatch[0]) : DateTime.now().year
  const year = inferredYear >= 2025 ? inferredYear : DateTime.now().year

  return DateTime.fromObject({
    year,
    month,
    day,
    hour,
    minute,
  }).toJSDate()
}

const extractReleaseYear = (text: string) => {
  const match = text.match(/\|\s*((?:19|20)\d{2})\s*\|/)
  return match?.[1] ? Number(match[1]) : undefined
}

const extractFromDetailPage = async (url: string): Promise<Screening[]> => {
  const html = await got(url).text()
  const page: XRayDetailPage = await xray(html, {
    bodyText: 'body@text | normalizeWhitespace | trim',
    h2Title: 'h2.entry-title | trim',
  })

  if (!hasEnglishSubtitles(page.bodyText)) {
    return []
  }

  const title = extractTitle(page)
  const date = extractDate(page.bodyText)

  if (!title || !date) {
    logger.warn('skipping page with missing title or date', { url })
    return []
  }

  return [
    {
      title,
      year: extractReleaseYear(page.bodyText),
      url,
      cinema: 'Filmhuis Cavia',
      date,
    },
  ]
}

const extractFromMainPage = async (): Promise<Screening[]> => {
  const html = await got('https://filmhuiscavia.nl/').text()
  const monthPageUrls = extractMonthPageUrls(html)
  const monthPages = await Promise.all(monthPageUrls.map((url) => got(url).text()))
  const detailUrls = Array.from(
    new Set(monthPages.flatMap((monthPage) => extractDetailUrls(monthPage))),
  )

  logger.info('detail urls', { detailUrls })

  const screenings = (await Promise.all(detailUrls.map(extractFromDetailPage))).flat()

  return makeScreeningsUniqueAndSorted(screenings)
}

runIfMain(extractFromMainPage, import.meta.url)

export default extractFromMainPage

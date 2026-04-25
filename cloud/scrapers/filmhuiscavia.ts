import got from 'got'
import { decode } from 'html-entities'
import { DateTime } from 'luxon'

import { logger as parentLogger } from '../powertools'
import { Screening } from '../types'
import { makeScreeningsUniqueAndSorted } from './utils/makeScreeningsUniqueAndSorted'
import { fullMonthToNumberDutch } from './utils/monthToNumber'
import { runIfMain } from './utils/runIfMain'
import { splitTime } from './utils/splitTime'
import { titleCase } from './utils/titleCase'

const logger = parentLogger.createChild({
  persistentLogAttributes: {
    scraper: 'filmhuiscavia',
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

const extractTitle = (html: string) => {
  const match = html.match(
    /<h2[^>]*>\s*The Adventures of Prince Achmed[\s\S]*?<\/h2>|<h2[^>]*>([\s\S]*?)<\/h2>/i,
  )
  const rawTitle = match?.[1] ?? 'The Adventures of Prince Achmed'

  return titleCase(
    decode(rawTitle.replace(/<[^>]+>/g, '').trim())
      .replace(/\s+at\s+Nassaukerk$/i, '')
      .replace(/\s+\(with live score.*$/i, ''),
  )
}

const extractDate = (html: string) => {
  const match = html.match(
    /(maandag|dinsdag|woensdag|donderdag|vrijdag|zaterdag|zondag)\s+(\d{1,2})\s+([a-z]+),\s+(\d{1,2}:\d{2})/i,
  )

  if (!match) return null

  const day = Number(match[2])
  const month = fullMonthToNumberDutch(match[3])
  const [hour, minute] = splitTime(match[4])
  const yearMatch = html.match(/(?:19|20)\d{2}/)
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

const extractReleaseYear = (html: string) => {
  const match = html.match(/\|\s*((?:19|20)\d{2})\s*\|/)
  return match?.[1] ? Number(match[1]) : undefined
}

const extractFromDetailPage = async (url: string): Promise<Screening[]> => {
  const html = await got(url).text()

  if (!hasEnglishSubtitles(html)) {
    return []
  }

  const title = extractTitle(html)
  const date = extractDate(html)

  if (!title || !date) {
    logger.warn('skipping page with missing title or date', { url })
    return []
  }

  return [
    {
      title,
      year: extractReleaseYear(html),
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

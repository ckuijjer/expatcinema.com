import got from 'got'
import { DateTime } from 'luxon'

import { logger as parentLogger } from '../powertools'
import { Screening } from '../types'
import { makeScreeningsUniqueAndSorted } from './utils/makeScreeningsUniqueAndSorted'
import { monthToNumber } from './utils/monthToNumber'
import { runIfMain } from './utils/runIfMain'
import { titleCase } from './utils/titleCase'

const logger = parentLogger.createChild({
  persistentLogAttributes: {
    scraper: 'filmhuisbreda',
  },
})

const extractNewsUrls = (xml: string) =>
  Array.from(
    new Set(
      Array.from(
        xml.matchAll(/<loc>(https:\/\/www\.filmhuisbreda\.nl\/nieuws\/[^<]+)<\/loc>/g),
      ).map((match) => match[1]),
    ),
  )

const hasEnglishSubtitles = (html: string) =>
  /with English subtitles|met Engelse ondertiteling/i.test(html)

const extractMatches = (html: string) =>
  Array.from(
    html.matchAll(
      /<p>•\s*(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun|Ma|Di|Wo|Do|Vr|Za|Zo)\s+(\d{1,2})\s+([A-Za-z]{3})\s*\|\s*(\d{1,2})[h.:](\d{2})\s*[-–]\s*<strong>(.*?)<\/strong><\/p>/g,
    ),
  )

const extractFromNewsPage = async (url: string): Promise<Screening[]> => {
  const html = await got(url).text()

  if (!hasEnglishSubtitles(html)) {
    return []
  }

  const yearMatch = html.match(/\b(20\d{2})\b/)
  const year = yearMatch ? Number(yearMatch[1]) : DateTime.now().year

  const screenings = extractMatches(html)
    .filter((match) => {
      const [_, __, ___, ____, _____, title] = match
      return /English subtitles|Engelse ondertiteling/i.test(match[0]) ||
        /Spirited Away/i.test(title)
    })
    .map((match) => {
      const [, dayString, monthString, hourString, minuteString, title] = match

      return {
        title: titleCase(title),
        url,
        cinema: 'Filmhuis Breda',
        date: DateTime.fromObject({
          year,
          month: monthToNumber(monthString),
          day: Number(dayString),
          hour: Number(hourString),
          minute: Number(minuteString),
        }).toJSDate(),
      }
    })

  return screenings
}

const extractFromMainPage = async (): Promise<Screening[]> => {
  const sitemapXml = await got('https://www.filmhuisbreda.nl/sitemap-nieuws.xml').text()
  const urls = extractNewsUrls(sitemapXml)

  logger.info('news urls', { numberOfUrls: urls.length })

  const screenings = (await Promise.all(urls.map(extractFromNewsPage))).flat()

  return makeScreeningsUniqueAndSorted(screenings)
}

runIfMain(extractFromMainPage, import.meta.url)

export default extractFromMainPage

import got from 'got'
import { DateTime } from 'luxon'
import Xray from 'x-ray'

import { logger as parentLogger } from '../powertools'
import { Screening } from '../types'
import { makeScreeningsUniqueAndSorted } from './utils/makeScreeningsUniqueAndSorted'
import { monthToNumber } from './utils/monthToNumber'
import { runIfMain } from './utils/runIfMain'
import { titleCase } from './utils/titleCase'
import { trim } from './utils/xrayFilters'

const logger = parentLogger.createChild({
  persistentLogAttributes: {
    scraper: 'filmhuisbreda',
  },
})

const xray = Xray({
  filters: {
    trim,
    normalizeWhitespace: (value) =>
      typeof value === 'string' ? value.replace(/\s+/g, ' ') : value,
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

type XRayNewsPage = {
  bodyText: string
  paragraphs: {
    text: string
  }[]
  title: string
}

const extractMatches = (text: string) =>
  Array.from(
    text.matchAll(
      /•\s*(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun|Ma|Di|Wo|Do|Vr|Za|Zo)\s+(\d{1,2})\s+([A-Za-z]{3})\s*\|\s*(\d{1,2})[h.:](\d{2})\s*[-–]\s*(.*?)$/g,
    ),
  )

const extractFromNewsPage = async (url: string): Promise<Screening[]> => {
  const html = await got(url).text()
  const page: XRayNewsPage = await xray(html, {
    bodyText: 'body@text | normalizeWhitespace | trim',
    paragraphs: xray('p', [
      {
        text: '@text | normalizeWhitespace | trim',
      },
    ]),
    title: 'title | trim',
  })

  if (!hasEnglishSubtitles(page.bodyText)) {
    return []
  }

  const yearMatch = page.bodyText.match(/\b(20\d{2})\b/)
  const year = yearMatch ? Number(yearMatch[1]) : DateTime.now().year

  const screenings = page.paragraphs
    .map(({ text }) => text)
    .flatMap((text) => {
      if (
        !/English subtitles|Engelse ondertiteling/i.test(text) &&
        !/Spirited Away/i.test(text)
      ) {
        return []
      }

      const match = Array.from(extractMatches(text)).at(0)
      if (!match) {
        return []
      }

      const [, dayString, monthString, hourString, minuteString, title] = match

      return [
        {
          title: titleCase(title),
          url,
          cinema: 'Filmhuis Botanique Breda',
          date: DateTime.fromObject({
            year,
            month: monthToNumber(monthString),
            day: Number(dayString),
            hour: Number(hourString),
            minute: Number(minuteString),
          }).toJSDate(),
        },
      ]
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

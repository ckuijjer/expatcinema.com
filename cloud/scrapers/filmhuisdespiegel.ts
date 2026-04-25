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
    scraper: 'filmhuisdespiegel',
  },
})

const xray = Xray({
  filters: {
    trim,
    normalizeWhitespace: (value) =>
      typeof value === 'string' ? value.replace(/\s+/g, ' ') : value,
  },
})

const extractUrlsFromSitemap = (xml: string) =>
  Array.from(
    xml.matchAll(
      /<loc>(https:\/\/schunck\.nl\/en\/museum\/agenda\/film-[^<]+)<\/loc>/g,
    ),
  ).map((match) => match[1])

const hasEnglishSubtitles = (html: string) => /English subtitles/i.test(html)

const isDeSpiegel = (text: string) => /Filmhuis De Spiegel/i.test(text)

type XRayDetailPage = {
  bodyText: string
  h1Title: string
  pageTitle: string
}

const extractTitle = (page: XRayDetailPage) => {
  if (page.h1Title) {
    return titleCase(page.h1Title.replace(/^Film:\s*/i, '').trim())
  }

  const titleTagMatch = page.pageTitle.match(
    /Filmhouse De Spiegel presents '(.*?)'/i,
  )
  return titleTagMatch?.[1] ? titleCase(titleTagMatch[1].trim()) : null
}

const extractDate = (text: string) => {
  const dateMatches = Array.from(text.matchAll(/"(\d{4}-\d{2}-\d{2})"/g))
  const timeMatches = Array.from(text.matchAll(/"(\d{2}:\d{2}:\d{2})"/g))
  const date = dateMatches.at(-1)?.[1]
  const time = timeMatches[0]?.[1]

  if (!date || !time) return null

  return DateTime.fromISO(`${date}T${time}`, {
    zone: 'Europe/Amsterdam',
  }).toJSDate()
}

const extractReleaseYear = (text: string) => {
  const match = text.match(/[^,]\s*((?:19|20)\d{2}),/)
  return match?.[1] ? Number(match[1]) : undefined
}

const extractFromDetailPage = async (url: string): Promise<Screening[]> => {
  const html = await got(url).text()
  const page: XRayDetailPage = await xray(html, {
    bodyText: 'body@text | normalizeWhitespace | trim',
    h1Title: 'h1 span | trim',
    pageTitle: 'title | trim',
  })

  if (!isDeSpiegel(page.bodyText) || !hasEnglishSubtitles(page.bodyText)) {
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
      cinema: 'Filmhuis De Spiegel',
      date,
    },
  ]
}

const extractFromMainPage = async (): Promise<Screening[]> => {
  const sitemapXml = await got('https://schunck.nl/__sitemap__/en-US_agenda.xml').text()
  const urls = extractUrlsFromSitemap(sitemapXml)

  logger.info('detail urls', { numberOfUrls: urls.length })

  const screenings = (await Promise.all(urls.map(extractFromDetailPage))).flat()

  return makeScreeningsUniqueAndSorted(screenings)
}

runIfMain(extractFromMainPage, import.meta.url)

export default extractFromMainPage

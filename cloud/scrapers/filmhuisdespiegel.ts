import got from 'got'
import { decode } from 'html-entities'
import { DateTime } from 'luxon'

import { logger as parentLogger } from '../powertools'
import { Screening } from '../types'
import { makeScreeningsUniqueAndSorted } from './utils/makeScreeningsUniqueAndSorted'
import { runIfMain } from './utils/runIfMain'
import { titleCase } from './utils/titleCase'

const logger = parentLogger.createChild({
  persistentLogAttributes: {
    scraper: 'filmhuisdespiegel',
  },
})

const extractUrlsFromSitemap = (xml: string) =>
  Array.from(
    xml.matchAll(
      /<loc>(https:\/\/schunck\.nl\/en\/museum\/agenda\/film-[^<]+)<\/loc>/g,
    ),
  ).map((match) => match[1])

const hasEnglishSubtitles = (html: string) => /English subtitles/i.test(html)

const isDeSpiegel = (html: string) => /Filmhuis De Spiegel/i.test(html)

const extractTitle = (html: string) => {
  const match = html.match(/<h1[^>]*><span>(.*?)<\/span><\/h1>/i)
  if (match?.[1]) {
    return titleCase(decode(match[1]).replace(/^Film:\s*/i, '').trim())
  }

  const titleTagMatch = html.match(
    /<title>Filmhouse De Spiegel presents &#x27;(.*?)&#x27;/i,
  )
  return titleTagMatch?.[1] ? titleCase(decode(titleTagMatch[1].trim())) : null
}

const extractDate = (html: string) => {
  const dateMatches = Array.from(html.matchAll(/"(\d{4}-\d{2}-\d{2})"/g))
  const timeMatches = Array.from(html.matchAll(/"(\d{2}:\d{2}:\d{2})"/g))
  const date = dateMatches.at(-1)?.[1]
  const time = timeMatches[0]?.[1]

  if (!date || !time) return null

  return DateTime.fromISO(`${date}T${time}`, {
    zone: 'Europe/Amsterdam',
  }).toJSDate()
}

const extractReleaseYear = (html: string) => {
  const match = html.match(/<p>[^<]*<br>[^<]*,\s*((?:19|20)\d{2}),/i)
  return match?.[1] ? Number(match[1]) : undefined
}

const extractFromDetailPage = async (url: string): Promise<Screening[]> => {
  const html = await got(url).text()

  if (!isDeSpiegel(html) || !hasEnglishSubtitles(html)) {
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

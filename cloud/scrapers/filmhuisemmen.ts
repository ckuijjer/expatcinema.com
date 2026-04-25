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
    scraper: 'filmhuisemmen',
  },
})

const extractSeasonUrls = (html: string) =>
  Array.from(
    new Set(
      Array.from(
        html.matchAll(
          /href="(https:\/\/www\.filmhuisemmen\.nl\/category\/archief\/[^"]+\/)"/g,
        ),
      ).map((match) => match[1]),
    ),
  )

const extractArchiveBlocks = (html: string) =>
  Array.from(
    html.matchAll(
      /<article id="post-\d+" class="post-[\s\S]*?<\/article>/g,
    ),
  ).map((match) => match[0])

const hasEnglishSubtitles = (html: string) => /ENGELS ONDERTITELD/i.test(html)

const extractUrl = (html: string) => {
  const match = html.match(
    /<h2 class="entry-title"[^>]*>\s*<a href="(https:\/\/www\.filmhuisemmen\.nl\/[^"]+\/)"/i,
  )
  return match?.[1] ?? null
}

const extractTitle = (html: string) => {
  const match = html.match(/<h2 class="entry-title"[^>]*>\s*<a [^>]*>(.*?)<\/a>/i)
  return match?.[1] ? titleCase(decode(match[1].trim())) : null
}

const extractDate = (html: string) => {
  const match = html.match(
    /datetime="(20\d{2})-(\d{2})-(\d{2})T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}"/,
  )
  if (!match) return null

  return DateTime.fromObject({
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
    hour: 20,
    minute: 0,
  }).toJSDate()
}

const extractFromArchiveBlock = (html: string): Screening[] => {
  if (!hasEnglishSubtitles(html)) {
    return []
  }

  const url = extractUrl(html)
  const title = extractTitle(html)
  const date = extractDate(html)

  if (!url || !title || !date) {
    logger.warn('skipping archive block with missing fields')
    return []
  }

  return [
    {
      title,
      url,
      cinema: 'Filmhuis Emmen',
      date,
    },
  ]
}

const extractFromSeasonPage = async (url: string): Promise<Screening[]> => {
  const html = await got(url).text()
  const screenings = extractArchiveBlocks(html).flatMap(extractFromArchiveBlock)

  return screenings
}

const extractFromMainPage = async (): Promise<Screening[]> => {
  const archiveHtml = await got('https://www.filmhuisemmen.nl/category/archief/').text()
  const seasonUrls = extractSeasonUrls(archiveHtml)

  logger.info('season urls', { numberOfUrls: seasonUrls.length })

  const screenings = (await Promise.all(seasonUrls.map(extractFromSeasonPage))).flat()

  return makeScreeningsUniqueAndSorted(screenings)
}

runIfMain(extractFromMainPage, import.meta.url)

export default extractFromMainPage

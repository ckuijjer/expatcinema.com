import got from 'got'
import { DateTime } from 'luxon'
import Xray from 'x-ray'

import { logger as parentLogger } from '../powertools'
import xRayPuppeteer from '../xRayPuppeteer'
import { extractYearFromTitle } from './utils/extractYearFromTitle'
import { guessYear } from './utils/guessYear'
import { shortMonthToNumberDutch } from './utils/monthToNumber'
import { runIfMain } from './utils/runIfMain'
import { splitTime } from './utils/splitTime'
import { titleCase } from './utils/titleCase'
import { trim } from './utils/xrayFilters'

const logger = parentLogger.createChild({
  persistentLogAttributes: {
    scraper: 'lab111',
  },
})

const xray = Xray({
  filters: {
    trim,
    normalizeWhitespace: (value) =>
      typeof value === 'string' ? value.replace(/\s+/g, ' ') : value,
  },
})
  .driver(xRayPuppeteer({ logger, waitForOptions: { timeout: 60_000 } }))
  .concurrency(3)
  .throttle(10, 300)

const detailPageXray = Xray({
  filters: {
    trim,
    normalizeWhitespace: (value) =>
      typeof value === 'string' ? value.replace(/\s+/g, ' ') : value,
  },
})

const hasEnglishSubtitles = (movie: XRayFromMainPage) =>
  movie.metadata.includes('Ondertiteling: Engels')

const cleanTitle = (title: string) => {
  return titleCase(
    title
      .replace(/ \(4k Restoration\)/i, '')
      .replace(' (with English subtitles)', '')
      .replace(/^Club Imagine:\s+/i, '')
      .replace(/^HoFF x IQMF:\s+/i, ''),
  )
}

type XRayFromMainPage = {
  title: string
  url: string
  metadata: string
  dates: string[]
}

type XRayFromDetailPage = {
  metadata: {
    label: string
    values: string[]
  }[]
}

const parseReleaseYear = (detailPage: XRayFromDetailPage) => {
  const releaseValues =
    detailPage.metadata.find(({ label }) => label === 'Release')?.values ?? []

  const match = releaseValues
    .map((value) => value.match(/\b((?:19|20)\d{2})\b/))
    .find(Boolean)

  return match?.[1] ? Number(match[1]) : undefined
}

const extractFromMainPage = async () => {
  try {
    logger.info('main page')

    const scrapeResult: XRayFromMainPage[] = await xray(
      // 'http://webcache.googleusercontent.com/search?q=cache:https://www.lab111.nl/programma/',
      'https://www.lab111.nl/programma/',
      '#programmalist .filmdetails',
      [
        {
          title: 'h2.hidemobile a | trim | normalizeWhitespace',
          url: 'h2.hidemobile a@href | trim',
          metadata: '.row.hidemobile | normalizeWhitespace',
          dates: ['.day td:first-child | trim'],
        },
      ],
    )

    logger.info('scrape result', { scrapeResult })

    const releaseYearByUrl = new Map(
      await Promise.all(
        Array.from(new Set(scrapeResult.map((movie) => movie.url))).map(
          async (url) => {
            const detailPage: XRayFromDetailPage = await detailPageXray(
              await got(url).text(),
              {
                metadata: [
                  '.zmovie-meta',
                  {
                    label: 'h4 | normalizeWhitespace',
                    values: ['li | normalizeWhitespace'],
                  },
                ],
              },
            )

            return [url, parseReleaseYear(detailPage)] as const
          },
        ),
      ),
    )

    const screenings = scrapeResult
      .filter(hasEnglishSubtitles)
      .flatMap((movie) => {
        return movie.dates.map((date) => {
          const [dayOfWeek, dayString, monthString, time] = date.split(/\s+/)
          const day = Number(dayString)
          const month = shortMonthToNumberDutch(monthString)
          const [hour, minute] = splitTime(time)
          const year = guessYear({
            day,
            month,
            hour,
            minute,
          })

          logger.debug('extracted date', {
            dateString: date,
            date: {
              day,
              month,
              hour,
              minute,
              year,
            },
          })

          return {
            title: cleanTitle(movie.title),
            year:
              releaseYearByUrl.get(movie.url) ??
              extractYearFromTitle(movie.title),
            url: movie.url,
            cinema: 'Lab111',
            date: DateTime.fromObject({
              day,
              month,
              hour,
              minute,
              year,
            }).toJSDate(),
          }
        })
      })

    logger.info('screenings found', { screenings })

    return screenings
  } catch (error) {
    logger.error('error scraping lab111', { error })
    return []
  }
}

runIfMain(extractFromMainPage, import.meta.url)

export default extractFromMainPage

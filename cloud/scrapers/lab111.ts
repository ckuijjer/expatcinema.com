import got from 'got'
import { DateTime } from 'luxon'
import pMap from 'p-map'
import Xray from 'x-ray'

import { logger as parentLogger } from '../powertools'
import { createXray } from '../xRay'
import xRayPuppeteer from '../xRayPuppeteer'
import { extractYearFromTitle } from './utils/extractYearFromTitle'
import { guessYear } from './utils/guessYear'
import { shortMonthToNumberDutch } from './utils/monthToNumber'
import { splitTime } from './utils/splitTime'
import { titleCase } from './utils/titleCase'
import { normalizeWhitespace, trim } from './utils/xrayFilters'

const logger = parentLogger.createChild({
  persistentLogAttributes: {
    scraper: 'lab111',
  },
})

const xray = Xray({
  filters: {
    trim,
    normalizeWhitespace,
  },
})
  .driver(xRayPuppeteer({ logger, waitForOptions: { timeout: 60_000 } }))
  .concurrency(3)
  .throttle(10, 300)

const detailPageXray = createXray({ logger })

const hasEnglishSubtitles = (movie: XRayFromMainPage) =>
  movie.metadata.includes('Ondertiteling: Engels')

const cleanTitle = (title: string) => {
  return titleCase(
    title
      .replace(/ \(4k Restoration\)/i, '')
      .replace(' (with English subtitles)', '')
      .replace(/^Club Imagine:\s+/i, '')
      .replace(/^HoFF x IQMF:\s+/i, '')
      .replace(/^IQMF:\s+/i, '')
      .replace(/^Africadelic & Caribbean Creativity Present\s+/i, '')
      .replace(/^Kaboom Cult Presents\s+/i, ''),
  )
}

type XRayFromMainPage = {
  title: string
  url: string
  metadata: string
  dates: string[]
}

type MetaItem = {
  label: string
  value: string
}

type XRayFromDetailPage = {
  meta: MetaItem[]
}

// A film page lists its details as label/value blocks:
//
//   <div class="zmovie-meta"><div ...><h4>Release</h4><ul class="release"><li>1 January 1988</li></ul></div></div>
//   <div class="zmovie-meta"><div ...><h4>Jaar</h4><ul class="jaar"><li>1964</li></ul></div></div>
//
// "Jaar" is the year of the film. "Release" is a date: "1 January <year>" when
// only the year is known, else the release in the Netherlands or, for a festival
// or event, its date ("30 October 2026" for Imagine Film Festival's Cure, a film
// from 1997). So a date in a past year counts, and a date in the current year
// only as "1 January": a wrong year is worse than none.
export const parseReleaseYear = (meta: MetaItem[]) => {
  const valueOf = (label: string) =>
    meta.find((item) => item.label === label)?.value.trim()

  const thisYear = DateTime.now().year
  const release = valueOf('Release')?.match(/^(\d{1,2}) (\w+) (\d{4})$/)
  const releaseYear =
    release &&
    (release[3] < String(thisYear) || release[1] + release[2] === '1January')
      ? release[3]
      : undefined

  const year = Number(valueOf('Jaar')?.match(/^\d{4}$/)?.[0] ?? releaseYear)

  return year >= 1888 && year <= thisYear + 2 ? year : undefined
}

export const extractReleaseYear = async (html: string) => {
  const detailPage: XRayFromDetailPage = await detailPageXray(html, {
    meta: detailPageXray('.zmovie-meta', [
      {
        label: 'h4 | normalizeWhitespace | trim',
        value: 'li | normalizeWhitespace | trim',
      },
    ]),
  })

  return parseReleaseYear(detailPage.meta ?? [])
}

const extractFromMainPage = async () => {
  try {
    logger.debug('main page')

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

    logger.debug('scrape result', { scrapeResult })

    const englishSubtitlesMovies = scrapeResult.filter(hasEnglishSubtitles)

    // A film page without a year, or one that can't be fetched, only leaves out the year
    const releaseYearByUrl = new Map(
      await pMap(
        Array.from(new Set(englishSubtitlesMovies.map(({ url }) => url))),
        async (url) => {
          try {
            const html = await got(url, {
              timeout: { request: 30_000 },
              retry: { limit: 2, maxRetryAfter: 10_000 },
            }).text()

            return [url, await extractReleaseYear(html)] as const
          } catch (error) {
            logger.warn('failed to extract the release year', { url, error })
            return [url, undefined] as const
          }
        },
        { concurrency: 5 },
      ),
    )

    const screenings = englishSubtitlesMovies.flatMap((movie) => {
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

    logger.debug('screenings found', { screenings })

    return screenings
  } catch (error) {
    logger.error('error scraping lab111', { error })
    return []
  }
}

export default extractFromMainPage

import { DateTime } from 'luxon'
import Xray from 'x-ray'

import { logger as parentLogger } from '../powertools'
import { Screening } from '../types'
import xRayPuppeteer from '../xRayPuppeteer'
import { extractYearFromTitle } from './utils/extractYearFromTitle'
import { guessYear } from './utils/guessYear'
import { monthToNumber } from './utils/monthToNumber'
import { removeYearSuffix } from './utils/removeYearSuffix'
import { splitTime } from './utils/splitTime'
import { titleCase } from './utils/titleCase'
import { normalizeWhitespace } from './utils/xrayFilters'

const logger = parentLogger.createChild({
  persistentLogAttributes: {
    scraper: 'florafilmtheater',
  },
})

const trim = (value: unknown) =>
  typeof value === 'string' ? value.trim() : value

const cleanTitle = (value: unknown) =>
  typeof value === 'string'
    ? titleCase(
        // Flora appends both an `- En Subs` subtitle marker and, in some cases,
        // a trailing release year suffix like `(1934)` to the public title.
        removeYearSuffix(value.replace(/\s*-\s*en subs$/i, '').trim()).trim(),
      )
    : value

const xray = Xray({
  filters: {
    cleanTitle,
    trim,
    normalizeWhitespace,
  },
})
  .driver(
    xRayPuppeteer({
      logger,
      waitForOptions: { timeout: 60_000, waitUntil: 'networkidle2' },
    }),
  )
  .concurrency(3)
  .throttle(10, 300)

type XRayFromMainPage = {
  rawTitle: string
  title: string
  url: string
  metadata: string[]
  screenings: string[]
}

// The badge reads 'EN SUBS', but also 'English SUBS' on some films
export const hasEnglishSubtitles = (
  movie: Pick<XRayFromMainPage, 'metadata'>,
) => movie.metadata.some((entry) => /^(?:EN|English) SUBS$/i.test(entry))

// A day has one or more showtimes: 'za 24 okt. 15:00 21:15' or 'Vandaag 21:30',
// and a showtime can be followed by a note: 'Morgen 19:25 Uitverkocht'
export const splitDateAndTimes = (screening: string) => {
  const times = screening.match(/\b\d{1,2}:\d{2}\b/g) ?? []
  const date = screening.split(/\b\d{1,2}:\d{2}\b/)[0].trim()

  return { date, times }
}

const extractMetadataYear = (metadata: string[]) => {
  const match = metadata
    .map((entry) => entry.match(/\b((?:19|20)\d{2})\b/))
    .find(Boolean)

  return match?.[1] ? Number(match[1]) : undefined
}

const splitDate = (date: string) => {
  if (date === 'Vandaag') {
    const { day, month, year } = DateTime.now()
    return { day, month, year }
  } else if (date === 'Morgen') {
    const { day, month, year } = DateTime.now().plus({ days: 1 })
    return { day, month, year }
  } else {
    const [dayString, monthString] = date
      .replace('.', '') // '8 mei.' => '8 mei'
      .split(/\s+/) // ['wo 8 mei'] => ['wo', '8', 'mei']
      .slice(1) // ['wo', '8', 'mei'] => ['8', 'mei']

    const day = Number(dayString)
    const month = monthToNumber(monthString)

    const year = guessYear({
      day,
      month,
    })

    return { day, month, year }
  }
}

const extractFromMainPage = async (): Promise<Screening[]> => {
  try {
    const url = 'https://florafilmtheater.nl/agenda'

    const movies: XRayFromMainPage[] = await xray(url, '.flex.flex-col.gap-8', [
      {
        rawTitle: 'a h2 | trim',
        title: 'a h2 | trim | cleanTitle',
        url: 'a@href',
        metadata: ['a ul li | normalizeWhitespace | trim'],
        screenings: ['> div .slide__item | normalizeWhitespace | trim'],
      },
    ])

    logger.debug('movies', { movies })

    const moviesWithEnglishSubtitles = movies.filter(hasEnglishSubtitles)

    if (moviesWithEnglishSubtitles.length === 0) {
      logger.warn('no movies with english subtitles')
      return []
    }

    logger.debug('movies', { moviesWithEnglishSubtitles })

    const screenings: Screening[] = moviesWithEnglishSubtitles.flatMap(
      (movie) => {
        return movie.screenings.flatMap((screening) => {
          const { date, times } = splitDateAndTimes(screening)

          // One screening in a format we don't know shouldn't take the rest of
          // the programme down with it
          let day: number, month: number, year: number
          try {
            ;({ day, month, year } = splitDate(date))
          } catch (error) {
            logger.warn('skipping screening with an unknown date', {
              screening,
              error,
            })
            return []
          }

          return times.map((time) => {
            const [hour, minute] = splitTime(time)

            return {
              title: movie.title,
              year:
                extractMetadataYear(movie.metadata) ??
                extractYearFromTitle(movie.rawTitle),
              url: movie.url,
              cinema: 'Flora Filmtheater',
              date: DateTime.fromObject({
                day,
                month,
                year,
                hour,
                minute,
              }).toJSDate(),
            }
          })
        })
      },
    )

    logger.debug('screenings', { screenings })

    return screenings
  } catch (error) {
    logger.error('error scraping florafilmtheater', { error })
    return []
  }
}

export default extractFromMainPage

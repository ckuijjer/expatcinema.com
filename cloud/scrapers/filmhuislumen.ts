import { DateTime } from 'luxon'
import Xray from 'x-ray'

import { logger as parentLogger } from '../powertools'
import { Screening } from '../types'
import { makeScreeningsUniqueAndSorted } from './utils/makeScreeningsUniqueAndSorted'
import { fullMonthToNumberDutch } from './utils/monthToNumber'
import { runIfMain } from './utils/runIfMain'
import { titleCase } from './utils/titleCase'
import { trim } from './utils/xrayFilters'

const logger = parentLogger.createChild({
  persistentLogAttributes: {
    scraper: 'filmhuislumen',
  },
})

const xray = Xray({
  filters: {
    trim,
    cleanTitle: (value) =>
      typeof value === 'string'
        ? titleCase(
            value
              .replace(/\s+\(.*\)$/, '') // e.g. (English subtitles), (+English subtitles // Expat Cinema)
              .replace(/\s+\[.*\]$/, '') // e.g. EL SUSPIRO DEL SILENCIO [THE WHISPER OF SILENCE] => EL SUSPIRO DEL SILENCIO
              .replace(/\s+\|\|.*$/, '') // e.g. TAMPOPO || A TASTE OF ASIA || + ENGLISH SUBTITLES => TAMPOPO
              .replace(/\s+–\s+25th anniversary/i, '') // e.g. Legally Blonde – 25th anniversary => Legally Blonde
              .replace(/^.*:/, '') // e.g. Expat Cinema:
              .replace(/ \+ English Subtitles/i, ''), // e.g.  + English Subtitles
          )
        : value,
    normalizeWhitespace: (value) =>
      typeof value === 'string' ? value.replace(/\s+/g, ' ') : value,
  },
})
  .concurrency(10)
  .throttle(10, 300)

type XRayFromMainPage = {
  title: string
  url: string
}

type XRayFromMoviePage = {
  title: string
  language: string
  subtitles: string
  year: string
  screenings: {
    date: string
    times: string[]
  }[]
}

// Parses dates like "Vandaag", "Morgen", "21 maart 2026"
const parseDate = (date: string) => {
  const trimmed = date.trim()
  if (trimmed === 'Vandaag') {
    const { day, month, year } = DateTime.now()
    return { day, month, year }
  } else if (trimmed === 'Morgen') {
    const { day, month, year } = DateTime.now().plus({ days: 1 })
    return { day, month, year }
  } else {
    // e.g. "21 maart 2026"
    const parts = trimmed.split(/\s+/)
    const day = Number(parts[0])
    const month = fullMonthToNumberDutch(parts[1])
    const year = Number(parts[2])
    return { day, month, year }
  }
}

const hasEnglishSubtitles = (movie: XRayFromMoviePage) => {
  const subtitles = movie.subtitles?.toLowerCase() ?? ''
  const title = movie.title?.toLowerCase() ?? ''

  // Film with English subtitles
  if (subtitles.includes('engels')) return true

  // Title-based fallback
  if (
    title.includes('engels ondertiteld') ||
    title.includes('english subtitles')
  )
    return true

  return false
}

const extractFromMoviePage = async ({
  title,
  url,
}: XRayFromMainPage): Promise<Screening[]> => {
  const movie: XRayFromMoviePage = await xray(url, {
    title: 'h1.wp-block-post-title | cleanTitle | trim',
    language: 'p.field-language .value | normalizeWhitespace | trim',
    subtitles: 'p.field-subtitles .value | normalizeWhitespace | trim',
    year: 'p.field-year .value | normalizeWhitespace | trim',
    screenings: xray('#voorstellingen .wp-block-group:has(> .datum-tekst)', [
      {
        date: '.datum-tekst | normalizeWhitespace | trim',
        times: ['a.voorstelling-tijd time@datetime'],
      },
    ]),
  })

  logger.info('extractFromMoviePage', { movie })

  if (!hasEnglishSubtitles(movie)) {
    return []
  }

  const screenings: Screening[] = movie.screenings
    .filter(({ date }) => date) // skip rows without a date (e.g. separator divs)
    .flatMap(({ date, times }) => {
      const { day, month, year } = parseDate(date)
      const releaseYear = Number(movie.year) || undefined

      return (times ?? []).map((time) => {
        const [hourStr, minuteStr] = time.split(':')
        const hour = Number(hourStr)
        const minute = Number(minuteStr)

        return {
          title: movie.title,
          year: releaseYear,
          url,
          cinema: 'Filmhuis Lumen',
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

  return screenings
}

const extractFromMainPage = async () => {
  // The english-expat page lists films tagged with reeksen-english / reeksen-expat-cinema
  const englishScrapeResult: XRayFromMainPage[] = await xray(
    'https://filmhuis-lumen.nl/specials/english-expat/',
    'li.wp-block-post',
    [
      {
        title:
          '.wp-block-post-title a | normalizeWhitespace | cleanTitle | trim',
        url: '.wp-block-post-title a@href',
      },
    ],
  )

  const programmaScrapeResult: XRayFromMainPage[] = await xray(
    'https://filmhuis-lumen.nl/programma/',
    'li.wp-block-post',
    [
      {
        title:
          '.wp-block-post-title a | normalizeWhitespace | cleanTitle | trim',
        url: '.wp-block-post-title a@href',
      },
    ],
  )

  // combine results and remove duplicates by URL
  const scrapeResult = [
    ...englishScrapeResult,
    ...programmaScrapeResult,
  ].filter(
    (item, index, self) =>
      item.url && index === self.findIndex((t) => t.url === item.url),
  )

  logger.info('scrape result', { scrapeResult })

  const screenings: Screening[] = (
    await Promise.all(scrapeResult.map(extractFromMoviePage))
  ).flat()

  logger.info('screenings found', { screenings })

  return makeScreeningsUniqueAndSorted(screenings)
}

runIfMain(extractFromMainPage, import.meta.url)

export default extractFromMainPage

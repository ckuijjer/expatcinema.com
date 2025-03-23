import { DateTime } from 'luxon'
import Xray from 'x-ray'

import { logger as parentLogger } from '../powertools'
import { Screening } from '../types'
import { monthToNumber } from './utils/monthToNumber'
import { splitTime } from './utils/splitTime'
import { titleCase } from './utils/titleCase'

const logger = parentLogger.createChild({
  persistentLogAttributes: {
    scraper: 'filmhuislumen',
  },
})

const xray = Xray({
  filters: {
    trim: (value) => (typeof value === 'string' ? value.trim() : value),
    cleanTitle: (value) =>
      typeof value === 'string'
        ? titleCase(
            value
              .replace(/\s+\(.*\)$/, '') // e.g. (English subtitles), (+English subtitles // Expat Cinema)
              .replace(/\s+\[.*\]$/, '') // e.g. EL SUSPIRO DEL SILENCIO [THE WHISPER OF SILENCE] => EL SUSPIRO DEL SILENCIO
              .replace(/\s+\|\|.*$/, '') // e.g. TAMPOPO || A TASTE OF ASIA || + ENGLISH SUBTITLES => TAMPOPO
              .replace(/^.*:/, ''), // e.g. Expat Cinema:
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
  metadata: string[]
  screenings: {
    date: string
    times: string[]
  }[]
}

const parseDate = (date: string) => {
  if (date === 'Vandaag') {
    const { day, month, year } = DateTime.now()
    return { day, month, year }
  } else if (date === 'Morgen') {
    const { day, month, year } = DateTime.now().plus({ days: 1 })
    return { day, month, year }
  } else {
    // b.v. ma 11.12
    const [dayString, monthString, yearString] = date.split(/\s+/)

    const day = Number(dayString)
    const month = monthToNumber(monthString)
    const year = Number(yearString)

    return { day, month, year }
  }
}

const hasEnglishSubtitles = (movie: XRayFromMoviePage) =>
  movie.metadata.includes('Ondertiteling Engels')

const extractFromMoviePage = async ({
  title,
  url,
}: XRayFromMainPage): Promise<Screening[]> => {
  const movie: XRayFromMoviePage = await xray(url, {
    title: '.movie-calendar h2 | cleanTitle | trim',
    metadata: ['.metadata li | normalizeWhitespace | trim'],
    screenings: xray('.moviecontentcontainer .shows-listing .day-shows', [
      // .moviecontentcontainer otherwise 2x the results
      {
        date: '.date | trim',
        times: ['a.button | trim'],
      },
    ]),
  })

  logger.info('extractFromMoviePage', { movie })

  if (!hasEnglishSubtitles(movie)) {
    logger.info('extractFromMoviePage without english subtitles', {
      url,
      title: movie.title,
    })

    return []
  }

  const screenings: Screening[] = movie.screenings.flatMap(
    ({ date, times }) => {
      const { day, month, year } = parseDate(date)

      return times.map((time) => {
        const [hour, minute] = splitTime(time)

        return {
          title: movie.title,
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
    },
  )

  return screenings
}

const extractFromMainPage = async () => {
  // look at the HTML for the page, not Chrome' DevTools, as there's JavaScript that changed the HTML.
  const scrapeResult: XRayFromMainPage[] = await xray(
    'https://filmhuis-lumen.nl/english/',
    '.movie-item',
    [
      {
        title: 'h4 | normalizeWhitespace | cleanTitle | trim',
        url: 'a@href',
      },
    ],
  )

  logger.info('scrape result', { scrapeResult })

  const screenings: Screening[] = (
    await Promise.all(scrapeResult.map(extractFromMoviePage))
  ).flat()

  logger.info('screenings found', { screenings })

  return screenings
}

if (
  (typeof module === 'undefined' || module.exports === undefined) && // running in ESM
  import.meta.url === new URL(import.meta.url).href // running as main module, not importing from another module
) {
  extractFromMainPage()
    .then((x) => JSON.stringify(x, null, 2))
    .then(console.log)

  // extractFromMoviePage({
  //   title: '',
  //   url: 'https://filmhuis-lumen.nl/films/im-still-here-3887/',
  // })
  //   .then((x) => JSON.stringify(x, null, 2))
  //   .then(console.log)
}

export default extractFromMainPage

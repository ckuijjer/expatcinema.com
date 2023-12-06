import Xray from 'x-ray'
import { Screening } from 'types'
import { DateTime } from 'luxon'

import xRayPuppeteer from '../xRayPuppeteer'
import guessYear from './utils/guessYear'
import { logger as parentLogger } from '../powertools'
import { shortMonthToNumberDutch } from './utils/monthToNumber'
import splitTime from './utils/splitTime'

const logger = parentLogger.createChild({
  persistentLogAttributes: {
    scraper: 'lumiere',
  },
})

const trim = (value) => (typeof value === 'string' ? value.trim() : value)

const cleanTitle = (value) =>
  typeof value === 'string'
    ? value.replace(/ - Engels ondertiteld/g, '')
    : value

const toLowerCase = (value) =>
  typeof value === 'string' ? value.toLowerCase() : value

const replaceNoBreakSpace = (value) =>
  typeof value === 'string' ? value.replace(/\u00a0/g, ' ') : value

const xray = Xray({
  filters: {
    cleanTitle,
    replaceNoBreakSpace,
    toLowerCase,
    trim,
  },
})
  .driver(xRayPuppeteer({ logger, waitForOptions: { timeout: 60000 } }))
  .concurrency(10)
  .throttle(10, 300)

type XRayFromProgrammaPage = {
  title: string
  url: string
  metadata: string
}

type XRayFromEnglishSubtitledPage = {
  title: string
  url: string
}

type XRayFromMoviePage = {
  title: string
  metadata: string
  screenings: {
    date: string
    times: string[]
  }[]
}

const extractFromMoviePage = async (url: string): Promise<Screening[]> => {
  logger.info('extracting', { url })

  const movie: XRayFromMoviePage = await xray(url, {
    title: '.movie-intro h1 | cleanTitle | trim',
    metadata: '.movie-info | replaceNoBreakSpace | toLowerCase | trim',
    screenings: xray('.time-tickets .item', [
      {
        date: '.date | trim',
        times: ['.time | trim'],
      },
    ]),
  })

  logger.info('extractFromMoviePage', { movie })

  if (!movie?.metadata?.includes('engels ondertiteld')) {
    logger.warn('extractFromMoviePage without english subtitles', {
      url,
      title: movie.title,
    })
    return []
  }

  const screenings: Screening[] = movie.screenings.flatMap(
    ({ date, times }) => {
      const [dayString, monthString] = date
        .replace(/\./g, '') // ['za. 2 sep.'] => ['za 2 sep']
        .split(/\s+/) // ['za 2 sep'] => ['za', '2', 'sep']
        .slice(1) // ['za', '2', 'sep'] => ['2', 'sep']

      const day = Number(dayString)
      const month = shortMonthToNumberDutch(monthString)

      const year = guessYear({
        day,
        month,
      })

      return times.map((time) => {
        const [hour, minute] = splitTime(time)

        return {
          title: movie.title,
          url,
          cinema: 'Lumière',
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

const extractFromProgrammaPage = async () => {
  const url = 'https://lumiere.nl/programma?sort=now'

  const movies: XRayFromProgrammaPage[] = await xray(url, '.item', [
    {
      title: '.info-wrapper h2 | cleanTitle | trim',
      url: '.info-wrapper a@href',
      metadata:
        '.info-wrapper .movie-info | replaceNoBreakSpace | toLowerCase | trim',
    },
  ])

  logger.info('extractFromProgrammaPage', { movies })

  const filteredMovies = movies.filter(({ title, metadata }) => {
    return metadata?.includes('engels ondertiteld')
  })

  logger.info('extractFromProgrammaPage', { filteredMovies })
  return filteredMovies
}

const extractFromEnglishSubtitledPage = async () => {
  const url = 'https://lumiere.nl/reeksen/english-subtitled-screenings'

  const movies: XRayFromEnglishSubtitledPage[] = await xray(
    url,
    '.movies-in-series a.article-block',
    [
      {
        title: 'h2 | cleanTitle | trim',
        url: '@href',
      },
    ],
  )

  logger.info('extractFromEnglishSubtitledPage', { movies })

  return movies
}

const extractFromMainPage = async () => {
  const moviesFromProgram = await extractFromProgrammaPage()
  const moviesFromEnglishSubtitled = await extractFromEnglishSubtitledPage()

  // get the unique urls
  const urls = [
    ...new Set(
      [...moviesFromProgram, ...moviesFromEnglishSubtitled].map(
        ({ url }) => url,
      ),
    ),
  ]

  const screenings = (await Promise.all(urls.map(extractFromMoviePage))).flat()

  logger.info('extractFromMainPage', { screenings })

  return screenings
}

if (require.main === module) {
  extractFromMainPage()
    .then((x) => JSON.stringify(x, null, 2))
    .then(console.log)

  // extractFromMoviePage('https://lumiere.nl/films/barbie')
  //   .then((x) => JSON.stringify(x, null, 2))
  //   .then(console.log)
}

export default extractFromMainPage

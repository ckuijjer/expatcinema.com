import got from 'got'
import { DateTime } from 'luxon'
import Xray from 'x-ray'

import { logger as parentLogger } from '../powertools'
import { Screening } from '../types'
import { guessYear } from './utils/guessYear'
import { fullMonthToNumberEnglish } from './utils/monthToNumber'
import { runIfMain } from './utils/runIfMain'
import { splitTime } from './utils/splitTime'
import { titleCase } from './utils/titleCase'
import { trim } from './utils/xrayFilters'

const logger = parentLogger.createChild({
  persistentLogAttributes: {
    scraper: 'rialto',
  },
})

const xray = Xray({
  filters: {
    trim,
    cleanTitle: (value) =>
      typeof value === 'string'
        ? titleCase(value.replace(/ - (Expat Cinema|Eng Subs)/i, ''))
        : value,
  },
})
  .concurrency(10)
  .throttle(10, 300)

type RialtoFilmFeedResult = {
  [cinema: string]: {
    [date: string]: {
      time: string
      link: string
      text: string
    }[]
  }
}

const extractReleaseYear = (html: string) => {
  const labelledCellMatch = html.match(
    /<dt[^>]*>\s*(?:Jaar|Release date)\s*<\/dt>\s*<dd[^>]*>\s*([^<]+)\s*<\/dd>/i,
  )

  const match = labelledCellMatch?.[1]?.match(/\b((?:19|20)\d{2})\b/)

  return match?.[1] ? Number(match[1]) : undefined
}

const extractFromMoviePage = async ({
  url,
  title,
}: {
  url: string
  title: string
}) => {
  // url example 'https://rialtofilm.nl/en/films/1519/a-hundred-flowers-expat-cinema'
  const regex = /\/films\/(?<movieId>\d+)\//
  const movieMatch = url.match(regex)
  const movieId = movieMatch?.groups?.movieId
  if (!movieId) {
    throw new Error(`Could not extract Rialto movie id from url: ${url}`)
  }

  const data: RialtoFilmFeedResult = await got(
    `https://rialtofilm.nl/feed/en/film/${movieId}`,
  ).json()
  const releaseYear = extractReleaseYear(await got(url).text())

  const screenings: Screening[] = Object.entries(data).flatMap(
    ([cinema, dates]) => {
      return Object.entries(dates).flatMap(([dateString, times]) => {
        return times.map(({ time, link, text }) => {
          const [dayOfWeek, dayString, monthString] = dateString.split(/\s+/)
          const day = Number(dayString)
          const month = fullMonthToNumberEnglish(monthString)
          const [hour, minute] = splitTime(time)

          const year = guessYear({ day, month, hour, minute })

          const date = DateTime.fromObject({
            year,
            day,
            month,
            hour,
            minute,
          })

          return {
            title,
            year: releaseYear,
            url,
            cinema,
            date: date.toJSDate(),
          }
        })
      })
    },
  )

  return screenings
}

const extractFromMainPage = async () => {
  const url = 'https://rialtofilm.nl/en/english-subtitles'

  const movies = await xray(url, '.card', [
    {
      title: '.card__title | trim | cleanTitle',
      url: '@href',
    },
  ])

  const screenings = (
    await Promise.all(movies.map(extractFromMoviePage))
  ).flat()

  logger.info('main page', { screenings })

  return screenings
}

runIfMain(extractFromMainPage, import.meta.url)

export default extractFromMainPage

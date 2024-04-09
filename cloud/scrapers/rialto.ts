import got from 'got'
import { DateTime } from 'luxon'
import { Screening } from 'types'
import Xray from 'x-ray'

import { logger as parentLogger } from '../powertools'
import { guessYear } from './utils/guessYear'
import { fullMonthToNumberEnglish } from './utils/monthToNumber'
import { splitTime } from './utils/splitTime'

const logger = parentLogger.createChild({
  persistentLogAttributes: {
    scraper: 'rialto',
  },
})

const xray = Xray({
  filters: {
    trim: (value) => (typeof value === 'string' ? value.trim() : value),
    cleanTitle: (value) =>
      typeof value === 'string' ? value.replace(' - Expat Cinema', '') : value,
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

const extractFromMoviePage = async ({
  url,
  title,
}: {
  url: string
  title: string
}) => {
  // url example 'https://rialtofilm.nl/en/films/1519/a-hundred-flowers-expat-cinema'
  const regex = /\/films\/(?<movieId>\d+)\//
  const {
    groups: { movieId },
  } = url.match(regex)

  const data: RialtoFilmFeedResult = await got(
    `https://rialtofilm.nl/feed/en/film/${movieId}`,
  ).json()

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

if (require.main === module) {
  extractFromMainPage()
    .then((x) => JSON.stringify(x, null, 2))
    .then(console.log)
}

export default extractFromMainPage

import got from 'got'
import { DateTime } from 'luxon'
import Xray from 'x-ray'

import { logger as parentLogger } from '../powertools'
import { Screening } from '../types'
import { guessYear } from './utils/guessYear'
import { shortMonthToNumberEnglish } from './utils/monthToNumber'

const logger = parentLogger.createChild({
  persistentLogAttributes: {
    scraper: 'themovies',
  },
})

const xray = Xray({
  filters: {
    trim: (value) => (typeof value === 'string' ? value.trim() : value),
  },
})

type XRayFromMainPage = {
  title: string
  url: string
  screenings: string[]
}

type FkFeedItem = {
  title: string
  language: { label: string; value: string }
  permalink: string
  times: { program_start: string; program_end: string; tags: string[] }[]
}

const extractFromSpecialExpatCinemaPage = async () => {
  const url = 'https://themovies.nl/en/special/expat-cinema/'

  const movies: XRayFromMainPage[] = await xray(url, '.tile', [
    {
      title: '.tile__title a | trim',
      url: '.tile__title a@href',
      screenings: ['.schedule__item | trim'],
    },
  ])

  const screenings: Screening[] = movies.flatMap(
    ({ title, url, screenings }) => {
      return screenings
        .filter((screening) => screening.includes('EN SUBS'))
        .map((screening) => {
          let day, month

          if (screening.startsWith('Today')) {
            day = DateTime.local().day
            month = DateTime.local().month
          } else if (screening.startsWith('Tomorrow')) {
            const tomorrow = DateTime.local().plus({ days: 1 })

            day = tomorrow.day
            month = tomorrow.month
          } else {
            const [dayOfWeek, dayString, monthString] = screening.split(/\s+/) // ['Wed', '21', 'Aug', '18:15', 'EN', 'SUBS']

            day = Number(dayString)
            month = shortMonthToNumberEnglish(monthString)
          }

          const [hour, minute] = screening
            .match(/\d\d:\d\d/)[0]
            .split(':')
            .map(Number)

          const year = guessYear({
            day,
            month,
            hour,
            minute,
          })

          return {
            title,
            url,
            cinema: 'The Movies',
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

  logger.info('main page', { screenings })

  return screenings
}

const hasEnglishSubtitles = (
  time: FkFeedItem['times'][0],
  movie: FkFeedItem,
) => {
  const movieHasEnglishSubtitels =
    movie.language?.label === 'Subtitles' && movie.language?.value === 'English'

  return movieHasEnglishSubtitels
}

// e.g. 202210181005 -> 2022-10-18T10:05:00.000Z
const extractDate = (time: string) =>
  DateTime.fromFormat(time, 'yyyyMMddHHmm').toJSDate()

const extractFromMainPage = async () => {
  const specialExpatScreenings = await extractFromSpecialExpatCinemaPage()

  const movies = Object.values<FkFeedItem>(
    await got('https://themovies.nl/en/fk-feed/agenda').json(),
  )

  logger.info('main page', { movies })

  const screenings: Screening[][] = movies
    .map((movie) => {
      return movie.times
        ?.filter((time) => hasEnglishSubtitles(time, movie))
        .map((time) => {
          return {
            title: movie.title,
            url: movie.permalink,
            cinema: 'The Movies',
            date: extractDate(time.program_start),
          }
        })
    })
    .filter((x) => x)

  logger.info('before flatten', { screenings })

  const allScreenings = [...specialExpatScreenings, ...screenings.flat()]

  const uniqueScreenings = allScreenings.reduce(
    (acc, screening) => {
      const key = `${screening.title}${screening.url}${screening.cinema}${screening.date}`

      if (!acc[key]) {
        acc[key] = screening
      }

      return acc
    },
    {} as Record<string, Screening>,
  )

  return Object.values(uniqueScreenings)
}

if (require.main === module) {
  extractFromMainPage()
    .then((x) => JSON.stringify(x, null, 2))
    .then(console.log)
}

export default extractFromMainPage

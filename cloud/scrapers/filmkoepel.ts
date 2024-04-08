import got from 'got'
import { DateTime } from 'luxon'
import { Screening } from 'types'
import Xray from 'x-ray'

import { logger as parentLogger } from '../powertools'
import guessYear from './utils/guessYear'
import { monthToNumber } from './utils/monthToNumber'

const logger = parentLogger.createChild({
  persistentLogAttributes: {
    scraper: 'filmkoepel',
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
  const url = 'https://filmkoepel.nl/special/expat-cinema/'

  const movies: XRayFromMainPage[] = await xray(url, '.tile', [
    {
      title: '.tile__title a | trim',
      url: '.tile__title a@href',
      screenings: ['.schedule__item | trim'],
    },
  ])

  logger.info('special expat cinema page', { movies })

  const screenings: Screening[] = movies.flatMap(
    ({ title, url, screenings }) => {
      return screenings
        .filter((screening) => screening.includes('EN SUBS'))
        .map((screening) => {
          let day, month

          if (
            screening.startsWith('Today') ||
            screening.startsWith('Vandaag')
          ) {
            day = DateTime.local().day
            month = DateTime.local().month
          } else if (
            screening.startsWith('Tomorrow') ||
            screening.startsWith('Morgen')
          ) {
            const tomorrow = DateTime.local().plus({ days: 1 })

            day = tomorrow.day
            month = tomorrow.month
          } else {
            const [dayOfWeek, dayString, monthString] = screening.split(/\s+/) // ['Wed', '21', 'Aug', '18:15', 'EN', 'SUBS']

            day = Number(dayString)
            month = monthToNumber(monthString)
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
            cinema: 'Filmkoepel',
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
  return hasEnglishSubtitlesLabel(movie) || hasTimeWithEnglishSubtitlesTag(time)
}

const hasEnglishSubtitlesLabel = (movie: FkFeedItem) => {
  return (
    movie.language.label === 'Ondertitels' && movie.language.value === 'Engels'
  )
}

// didn't see an occurrence of this yet in filmkoepel, but let's support it anyway
const hasTimeWithEnglishSubtitlesTag = (time: FkFeedItem['times'][0]) => {
  return time.tags.includes('EN SUBS')
}

// e.g. 202210181005 -> 2022-10-18T10:05:00.000Z
const extractDate = (time: string) =>
  DateTime.fromFormat(time, 'yyyyMMddHHmm').toJSDate()

const extractFromMainPage = async () => {
  const specialExpatScreenings = await extractFromSpecialExpatCinemaPage()

  const movies = Object.values<FkFeedItem>(
    await got('https://filmkoepel.nl/fk-feed/agenda').json(),
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
            cinema: 'Filmkoepel',
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

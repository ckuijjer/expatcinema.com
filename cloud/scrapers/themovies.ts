import Xray from 'x-ray'
import { Screening } from 'types'
import { DateTime } from 'luxon'

import guessYear from './guessYear'
import { logger as parentLogger } from '../powertools'
import { shortMonthToNumber } from './monthToNumber'

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

const extractFromMainPage = async () => {
  const url = 'https://themovies.nl/en/special/expat-cinema/'

  const movies: XRayFromMainPage[] = await xray(url, '.tile', [
    {
      title: '.tile__title a | trim',
      url: '.tile__title a@href',
      screenings: ['.schedule__item'],
    },
  ])

  const screenings: Screening[] = movies.flatMap(
    ({ title, url, screenings }) => {
      return screenings
        .filter((screening) => screening.includes('EN SUBS'))
        .map((screening) => {
          const [dayString, monthString, time] = screening.split(/\s+/).slice(2) // ['21', 'Aug', '18:15', 'EN', 'SUBS']
          const day = Number(dayString)
          const month = shortMonthToNumber(monthString)

          const [hour, minute] = time.split(':').map(Number)

          const year = guessYear(
            DateTime.fromObject({
              day,
              month,
              hour,
              minute,
            }),
          )

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

if (require.main === module) {
  extractFromMainPage()
    .then((x) => JSON.stringify(x, null, 2))
    .then(console.log)
}

export default extractFromMainPage

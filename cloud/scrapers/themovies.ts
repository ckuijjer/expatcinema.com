import Xray from 'x-ray'
import { Screening } from 'types'
import { DateTime } from 'luxon'

import guessYear from './utils/guessYear'
import { logger as parentLogger } from '../powertools'
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

const extractFromMainPage = async () => {
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

if (require.main === module) {
  extractFromMainPage()
    .then((x) => JSON.stringify(x, null, 2))
    .then(console.log)
}

export default extractFromMainPage

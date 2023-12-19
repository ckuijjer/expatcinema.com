import Xray from 'x-ray'
import { DateTime } from 'luxon'

import guessYear from './utils/guessYear'
import { Screening } from '../types'
import { logger as parentLogger } from '../powertools'
import { fullMonthToNumberDutch } from './utils/monthToNumber'
import splitTime from './utils/splitTime'

const logger = parentLogger.createChild({
  persistentLogAttributes: {
    scraper: 'forumgroningen',
  },
})

const xray = Xray({
  filters: {
    trim: (value) => (typeof value === 'string' ? value.trim() : value),
    cleanTitle: (value) =>
      typeof value === 'string'
        ? value.replace('Movie: ', '').replace('Film: ', '')
        : value,
    normalizeWhitespace: (value) =>
      typeof value === 'string' ? value.replace(/\s+/g, ' ') : value,
  },
})
  .concurrency(10)
  .throttle(10, 300)

type XRayFromMoviePage = {
  title: string
  screenings: {
    date: string
    times: {
      time: string
      tags: string
    }[]
  }[]
}

const extractFromMoviePage = async ({
  url,
}: {
  url: string
}): Promise<Screening[]> => {
  const scrapeResult: XRayFromMoviePage = await xray(url, {
    title: 'h1.title',
    screenings: xray('.calendar-day', [
      {
        date: '.calendar-day-head | normalizeWhitespace | trim',
        times: xray('.calendar-day-content .time', [
          {
            time: 'div | normalizeWhitespace | trim',
            tags: '.warning | cleanTitle | trim',
          },
        ]),
      },
    ]),
  })

  logger.info('scrapeResult', { scrapeResult })

  const screenings: Screening[] = scrapeResult.screenings.flatMap(
    ({ date, times }) => {
      return times
        .filter(({ tags }) => tags?.toLowerCase().includes('english subtitles'))
        .map(({ time }) => {
          const [dayOfWeek, dayString, monthString] = date.split(/\s+/)
          const day = Number(dayString)
          const month = fullMonthToNumberDutch(monthString)
          const [startTime, endTime] = time.split(/ tot | till /)
          const [hour, minute] = splitTime(startTime)

          const year = guessYear({
            day,
            month,
            hour,
            minute,
          })

          return {
            title: scrapeResult.title,
            url,
            cinema: 'Forum Groningen',
            date: DateTime.fromObject({
              year,
              day,
              month,
              hour,
              minute,
            }).toJSDate(),
          }
        })
    },
  )

  logger.info('screenings', { screenings })
  return screenings
}

const extractFromMainPage = async (): Promise<Screening[]> => {
  // note that the program might have more expat-friendly movies than this page, however there's no
  // easy way to go through the entire agenda
  const url = 'https://forum.nl/en/whats-on/international-movie-night'

  const movies = (
    await xray(url, '.content-row-medium.text-and-image', [
      {
        title: 'h2 | cleanTitle | trim',
        url: 'a@href',
      },
    ])
  ).filter(({ url }) => url !== undefined) // remove movies without url (e.g. in the past)

  logger.info('extracted', { movies })

  const screenings = (
    await Promise.all(movies.map(extractFromMoviePage))
  ).flat()

  logger.info('screenings', { screenings })

  return screenings
}

if (require.main === module) {
  // extractFromMoviePage({
  //   // url: 'https://forum.nl/nl/agenda/gaia',
  //   // url: 'https://forum.nl/nl/agenda/ringu',
  //   // url: 'https://forum.nl/nl/agenda/passages',p
  //   url: 'https://forum.nl/nl/agenda/pans-labyrinth',
  // })

  extractFromMainPage()
    .then((x) => JSON.stringify(x, null, 2))
    .then(console.log)
}

export default extractFromMainPage

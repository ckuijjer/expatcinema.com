import { DateTime } from 'luxon'
import Xray from 'x-ray'

import { logger as parentLogger } from '../powertools'
import { Screening } from '../types'
import { guessYear } from './utils/guessYear'
import { makeScreeningsUniqueAndSorted } from './utils/makeScreeningsUniqueAndSorted'
import { fullMonthToNumberEnglish } from './utils/monthToNumber'
import { titleCase } from './utils/titleCase'

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
        ? titleCase(
            value
              .replace('Movie: ', '')
              .replace('Film: ', '')
              .replace('Classics: ', ''),
          )
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
    title: 'h1.title | cleanTitle | trim',
    screenings: xray('.calendar-day', [
      {
        date: '.calendar-day-head | normalizeWhitespace | trim',
        times: xray('.calendar-day-content .ticket-row', [
          {
            time: '.time | normalizeWhitespace | trim',
            tags: '.tag | cleanTitle | trim',
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
          const month = fullMonthToNumberEnglish(monthString)
          const [startTime, endTime] = time.split(/ tot | till | - /)
          const { hour, minute } = DateTime.fromFormat(startTime, 'h:mm a')

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

  const uniqueSortedScreenings = makeScreeningsUniqueAndSorted(screenings)
  logger.info('screenings', { screenings: uniqueSortedScreenings })
  return uniqueSortedScreenings
}

const extractFromMainPage = async (): Promise<Screening[]> => {
  // note that the program might have more expat-friendly movies than this page, however there's no
  // easy way to go through the entire agenda
  const url = 'https://forum.nl/en/whats-on/international-movie-night'

  const movies = (
    await xray(url, '.calendar-list .ticket-row', [
      {
        title: '.content .title | cleanTitle | trim',
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

if (
  (typeof module === 'undefined' || module.exports === undefined) && // running in ESM
  import.meta.url === new URL(import.meta.url).href // running as main module, not importing from another module
) {
  // extractFromMoviePage({
  //   url: 'https://forum.nl/en/whats-on/film/dead-talents-society',
  // })

  extractFromMainPage()
    .then((x) => JSON.stringify(x, null, 2))
    .then(console.log)
}

export default extractFromMainPage

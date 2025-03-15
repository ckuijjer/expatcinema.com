// like Kino
import got from 'got'
import { decode } from 'html-entities'
import { DateTime } from 'luxon'

import { logger as parentLogger } from '../powertools'
import { Screening } from '../types'
import { titleCase } from './utils/titleCase'

const logger = parentLogger.createChild({
  persistentLogAttributes: {
    scraper: 'bioscopenleiden',
  },
})

// e.g. 202210181005 -> 2022-10-18T10:05:00.000Z
const extractDate = (time: string) =>
  DateTime.fromFormat(time, 'yyyyMMddHHmm').toJSDate()

// e.g. Kijkhuis 1 -> Kijkhuis
const extractLocation = (room: string) => {
  return room.replace(/\s+\d+$/, '')
}

// e.g. kijkhuis -> Kijkhuis
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

type FkFeedItem = {
  title: string
  language: { label: string; value: string }
  permalink: string
  times: {
    program_start: string
    program_end: string
    tags: string[]
    location: string
  }[]
}

const hasEnglishSubtitlesLabel = (movie: FkFeedItem) => {
  return (
    movie.language.label === 'Ondertitels' &&
    (movie.language.value === 'Engels' || movie.language.value === 'English')
  )
}

const hasTimeWithEnglishSubtitlesTag = (time: FkFeedItem['times'][0]) => {
  return time.tags.includes('EN SUBS')
}

const cleanTitle = (title: string) => titleCase(title)

const extractFromMainPage = async (): Promise<Screening[]> => {
  const movies = Object.values<FkFeedItem>(
    await got('https://bioscopenleiden.nl/fk-feed/agenda').json(),
  )

  logger.info('main page', { movies })

  const screenings: Screening[][] = movies
    .map((movie) => {
      return movie.times
        ?.filter(
          (time) =>
            hasEnglishSubtitlesLabel(movie) ||
            hasTimeWithEnglishSubtitlesTag(time),
        )
        .map((time) => {
          return {
            title: cleanTitle(decode(movie.title)),
            url: movie.permalink,
            cinema: capitalize(extractLocation(time.location)),
            date: extractDate(time.program_start),
          }
        })
    })
    .filter((x) => x)

  logger.info('before flatten', { screenings })

  return screenings.flat()
}

if (
  (typeof module === 'undefined' || module.exports === undefined) && // running in ESM
  import.meta.url === new URL(import.meta.url).href // running as main module, not importing from another module
) {
  extractFromMainPage()
    .then((x) => JSON.stringify(x, null, 2))
    .then(console.log)
}

export default extractFromMainPage

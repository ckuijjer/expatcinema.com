import got from 'got'
import { decode } from 'html-entities'
import { DateTime } from 'luxon'

import { logger as parentLogger } from '../powertools'
import { Screening } from '../types'
import { extractYearFromTitle } from './utils/extractYearFromTitle'
import { parseFkFeedYear } from './utils/parseFkFeedYear'
import { fkFeedHasEnglishSubtitles } from './utils/fkFeedEnglishSubtitles'
import { titleCase } from './utils/titleCase'

const logger = parentLogger.createChild({
  persistentLogAttributes: {
    scraper: 'slachtstraat',
  },
})

type FkFeedItem = {
  title: string
  year?: string
  language: { label: string; value: string }
  permalink: string
  times: {
    program_start: string
    program_end: string
    tags: string[]
    location: string
  }[]
}

// e.g. 202210181005 -> 2022-10-18T10:05:00.000Z
const extractDate = (time: string) =>
  DateTime.fromFormat(time, 'yyyyMMddHHmm').toJSDate()

const cleanTitle = (title: string) => titleCase(title)

// The feed's year field is sometimes empty while the title states the year,
// e.g. "Good Bye, Lenin! (2003)" with year ""
export const extractYear = (title: string, year?: string) =>
  parseFkFeedYear(year) ?? extractYearFromTitle(title)

const extractFromMainPage = async (): Promise<Screening[]> => {
  const movies = Object.values<FkFeedItem>(
    await got('https://slachtstraat.nl/fk-feed/agenda').json(),
  )

  logger.debug('main page', { movies })

  const screenings: Screening[][] = movies
    .map((movie) => {
      return movie.times
        ?.filter((time) =>
          fkFeedHasEnglishSubtitles(movie, time, { venues: ['Slachtstraat'] }),
        )
        .map((time) => {
          const title = cleanTitle(decode(movie.title))
          return {
            title,
            year: extractYear(title, movie.year),
            url: movie.permalink,
            cinema: 'Slachtstraat',
            date: extractDate(time.program_start),
          }
        })
    })
    .filter((x) => x)

  logger.debug('before flatten', { screenings })

  return screenings.flat()
}

export default extractFromMainPage

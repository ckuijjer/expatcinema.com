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
    scraper: 'springhaver',
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

// The feed's year field is often empty for repertory films, while the title
// then carries it, e.g. "Akira (1988)" has year '' in the feed.
export const extractYear = (movie: Pick<FkFeedItem, 'title' | 'year'>) =>
  parseFkFeedYear(movie.year) ?? extractYearFromTitle(decode(movie.title))

const cleanTitle = (title: string) => titleCase(title)

const extractFromMainPage = async (): Promise<Screening[]> => {
  const movies = Object.values<FkFeedItem>(
    await got('https://springhaver.nl/fk-feed/agenda').json(),
  )

  logger.debug('main page', { movies })

  const screenings: Screening[][] = movies
    .map((movie) => {
      return movie.times
        ?.filter((time) =>
          fkFeedHasEnglishSubtitles(movie, time, { venues: ['Springhaver'] }),
        )
        .map((time) => {
          return {
            title: cleanTitle(decode(movie.title)),
            year: extractYear(movie),
            url: movie.permalink,
            cinema: 'Springhaver',
            date: extractDate(time.program_start),
          }
        })
    })
    .filter((x) => x)

  logger.debug('before flatten', { screenings })

  return screenings.flat()
}

export default extractFromMainPage

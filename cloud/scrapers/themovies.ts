import got from 'got'
import { decode } from 'html-entities'
import { DateTime } from 'luxon'

import { logger as parentLogger } from '../powertools'
import { Screening } from '../types'
import { parseFkFeedYear } from './utils/parseFkFeedYear'
import { fkFeedHasEnglishSubtitles } from './utils/fkFeedEnglishSubtitles'
import { runIfMain } from './utils/runIfMain'
import { titleCase } from './utils/titleCase'

const logger = parentLogger.createChild({
  persistentLogAttributes: {
    scraper: 'themovies',
  },
})

type FkFeedItem = {
  title: string
  year?: string
  language: { label: string; value: string }
  permalink: string
  times: { program_start: string; program_end: string; tags: string[] }[]
}

// e.g. 202210181005 -> 2022-10-18T10:05:00.000Z
const extractDate = (time: string) =>
  DateTime.fromFormat(time, 'yyyyMMddHHmm').toJSDate()

const cleanTitle = (title: string) => titleCase(decode(title))

const extractFromMainPage = async () => {
  const movies = Object.values<FkFeedItem>(
    await got('https://themovies.nl/fk-feed/agenda').json(),
  )

  logger.debug('main page', { movies })

  const screenings: Screening[][] = movies
    .map((movie) => {
      return movie.times
        ?.filter((time) => fkFeedHasEnglishSubtitles(movie, time))
        ?.map((time) => {
          return {
            title: cleanTitle(movie.title),
            year: parseFkFeedYear(movie.year),
            url: movie.permalink,
            cinema: 'The Movies',
            date: extractDate(time.program_start),
          }
        })
    })
    .filter((x) => x)

  logger.debug('before flatten', { screenings })

  return screenings.flat()
}

runIfMain(extractFromMainPage, import.meta.url)

export default extractFromMainPage

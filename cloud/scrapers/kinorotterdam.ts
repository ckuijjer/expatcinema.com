// like Bioscopenleiden
import { remove } from 'diacritics'
import got from 'got'
import { decode } from 'html-entities'
import { DateTime } from 'luxon'

import { logger as parentLogger } from '../powertools'
import { Screening } from '../types'
import { removeYearSuffix } from './utils/removeYearSuffix'
import { titleCase } from './utils/titleCase'

const logger = parentLogger.createChild({
  persistentLogAttributes: {
    scraper: 'kinorotterdam',
  },
})

// e.g. 202210181005
const extractDate = (time: string) =>
  DateTime.fromFormat(time, 'yyyyMMddHHmm').toJSDate()

type FkFeedItem = {
  title: string
  language: { label: string; value: string }
  permalink: string
  times: { program_start: string; program_end: string; tags: string[] }[]
}

const hasEnglishSubtitles = (
  time: FkFeedItem['times'][0],
  movie: FkFeedItem,
) => {
  const allScreeningsHaveEnglishSubtitels =
    movie.language.label === 'Ondertitels' &&
    (movie.language.value === 'English' || movie.language.value === 'Engels')

  const specificScreeningHasEnglishSubtitles = time.tags.some((tag) =>
    /en subs/i.test(tag),
  )

  return (
    allScreeningsHaveEnglishSubtitels || specificScreeningHasEnglishSubtitles
  )
}

const removeSpecialPrefix = (title: string) => {
  return title.replace(/^kinoxeur:\s+/i, '')
}

const cleanTitle = (title: string) => {
  return titleCase(removeYearSuffix(removeSpecialPrefix(title)))
}

const extractFromMainPage = async (): Promise<Screening[]> => {
  const movies = Object.values<FkFeedItem>(
    await got('https://kinorotterdam.nl/fk-feed/agenda').json(),
  )

  logger.info('main page', { movies })

  const screenings: Screening[][] = movies
    .map((movie) => {
      return movie.times
        ?.filter((time) => hasEnglishSubtitles(time, movie))
        .map((time) => {
          return {
            title: cleanTitle(decode(movie.title)),
            url: movie.permalink,
            cinema: 'Kino',
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

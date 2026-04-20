// like Bioscopenleiden
import got from 'got'
import { decode } from 'html-entities'
import { DateTime } from 'luxon'

import { logger as parentLogger } from '../powertools'
import { Screening } from '../types'
import { extractYearFromTitle } from './utils/extractYearFromTitle'
import { parseFkFeedYear } from './utils/parseFkFeedYear'
import { removeYearSuffix } from './utils/removeYearSuffix'
import { runIfMain } from './utils/runIfMain'
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
  year?: string
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

const removeSpecialSuffixes = (title: string) => {
  return title
    .replace(/\s+[0-9]+th anniversary$/i, '')
    .replace(/\s+[–-]\s+part 1 & 2$/i, '')
    .replace(/\s+[–-]\s+a 70mm presentation$/i, '')
}

const normalizeAcronyms = (title: string) => {
  return title.replace(/\b(?:[A-Za-z]\.){2,}[A-Za-z]\.?/g, (match) =>
    match.toUpperCase(),
  )
}

const cleanTitle = (title: string) => {
  return normalizeAcronyms(
    titleCase(
      removeYearSuffix(removeSpecialSuffixes(removeSpecialPrefix(title))),
    ),
  )
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
            year:
              parseFkFeedYear(movie.year) ?? extractYearFromTitle(movie.title),
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

runIfMain(extractFromMainPage, import.meta.url)

export default extractFromMainPage

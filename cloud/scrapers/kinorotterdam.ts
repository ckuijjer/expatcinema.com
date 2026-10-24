// like Bioscopenleiden
import got from 'got'
import { decode } from 'html-entities'
import { DateTime } from 'luxon'

import { logger as parentLogger } from '../powertools'
import { Screening } from '../types'
import { extractYearFromTitle } from './utils/extractYearFromTitle'
import { parseFkFeedYear } from './utils/parseFkFeedYear'
import { parseFkFeedDirector } from './utils/parseFkFeedDirector'
import { removeYearSuffix } from './utils/removeYearSuffix'
import { fkFeedHasEnglishSubtitles } from './utils/fkFeedEnglishSubtitles'
import { extractAll, extractAnniversaryNote } from './utils/extractNotes'
import type { TitleAndNotes } from './utils/extractNotes'
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
  director_name?: { label: string; value: string } | ''
  times: { program_start: string; program_end: string; tags: string[] }[]
}

const removeSpecialPrefix = (title: string) => {
  return title.replace(/^kinoxeur:\s+/i, '')
}

// "Amélie (2001) –": a dash without a second part is left behind
const removeTrailingDash = (title: string): TitleAndNotes => ({
  title: title.replace(/\s+[–-]$/, ''),
})

// "Dune – Part 1 & 2" and "2001 – A 70mm Presentation" are kept as notes
const extractSuffixNote = (title: string): TitleAndNotes => {
  const match = title.match(
    /^(.+?)\s+[–-]\s+(part 1 & 2|a 70mm presentation)$/i,
  )

  return match ? { title: match[1], notes: [titleCase(match[2])] } : { title }
}

const normalizeAcronyms = (title: string) => {
  return title.replace(/\b(?:[A-Za-z]\.){2,}[A-Za-z]\.?/g, (match) =>
    match.toUpperCase(),
  )
}

export const parseTitle = (rawTitle: string): TitleAndNotes => {
  const { title, notes } = extractAll(
    removeSpecialPrefix(rawTitle),
    extractAnniversaryNote,
    removeTrailingDash,
    (title) => ({ title: removeYearSuffix(title) }),
    extractSuffixNote,
  )

  return { title: normalizeAcronyms(titleCase(title)), ...(notes && { notes }) }
}

const extractFromMainPage = async (): Promise<Screening[]> => {
  const movies = Object.values<FkFeedItem>(
    await got('https://kinorotterdam.nl/fk-feed/agenda').json(),
  )

  logger.debug('main page', { movies })

  const screenings: Screening[][] = movies
    .map((movie) => {
      return movie.times
        ?.filter((time) => fkFeedHasEnglishSubtitles(movie, time))
        .map((time) => {
          return {
            ...parseTitle(decode(movie.title)),
            year:
              parseFkFeedYear(movie.year) ?? extractYearFromTitle(movie.title),
            director: parseFkFeedDirector(movie.director_name),
            url: movie.permalink,
            cinema: 'Kino',
            date: extractDate(time.program_start),
          }
        })
    })
    .filter((x) => x)

  logger.debug('before flatten', { screenings })

  return screenings.flat()
}

export default extractFromMainPage

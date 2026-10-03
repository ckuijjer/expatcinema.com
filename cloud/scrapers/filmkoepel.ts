import got from 'got'
import { DateTime } from 'luxon'

import { logger as parentLogger } from '../powertools'
import { Screening } from '../types'
import { fkFeedHasEnglishSubtitles } from './utils/fkFeedEnglishSubtitles'
import { makeScreeningsUniqueAndSorted } from './utils/makeScreeningsUniqueAndSorted'
import { parseFkFeedYear } from './utils/parseFkFeedYear'
import { titleCase } from './utils/titleCase'

const logger = parentLogger.createChild({
  persistentLogAttributes: {
    scraper: 'filmkoepel',
  },
})

// Filmkoepel's /special/expat-cinema/ page used to list the Expat Cinema films
// itself (.tile / .schedule__item, with an 'EN SUBS' label per screening). Since
// its redesign it only shows the generic film list of the day, without any
// subtitle information (verified against the Wayback Machine snapshots of
// 2025-10-14 and 2026-04-19 and the live page of 2026-10-02), so English
// subtitles are read from the agenda feed instead, like the other cinemas on
// the same platform (see fkFeedEnglishSubtitles).
const FEED_URL = 'https://filmkoepel.nl/fk-feed/agenda'

type FkFeedItem = {
  title: string
  year?: string
  language?: { label: string; value: string } | ''
  permalink: string
  times?: { program_start: string; program_end: string; tags?: string[] }[]
}

// e.g. 202210181005 -> 2022-10-18T10:05:00 Europe/Amsterdam
export const extractDate = (time: string) =>
  DateTime.fromFormat(time, 'yyyyMMddHHmm', {
    zone: 'Europe/Amsterdam',
  }).toJSDate()

export const cleanTitle = (title: string) => titleCase(title.trim())

// The feed is an object keyed by film (or a list); films without showtimes
// have no `times`
export const extractScreeningsFromFeed = (
  feed: Record<string, FkFeedItem> | FkFeedItem[],
): Screening[] =>
  Object.values(feed).flatMap((movie) =>
    (movie.times ?? [])
      .filter((time) => fkFeedHasEnglishSubtitles(movie, time))
      .map((time) => ({
        title: cleanTitle(movie.title),
        year: parseFkFeedYear(movie.year),
        url: movie.permalink,
        cinema: 'Filmkoepel',
        date: extractDate(time.program_start),
      })),
  )

const extractFromMainPage = async (): Promise<Screening[]> => {
  const feed = await got(FEED_URL).json<
    Record<string, FkFeedItem> | FkFeedItem[]
  >()

  const movies = Object.values(feed)

  logger.debug('feed', { movies: movies.length })

  if (movies.length === 0) {
    logger.warn('the agenda feed has no films')
  }

  const screenings = makeScreeningsUniqueAndSorted(
    extractScreeningsFromFeed(feed),
  )

  logger.debug('screenings', { screenings })

  return screenings
}

export default extractFromMainPage

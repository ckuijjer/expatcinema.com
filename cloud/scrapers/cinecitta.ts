import got from 'got'
import { decode } from 'html-entities'
import { DateTime } from 'luxon'

import { logger as parentLogger } from '../powertools'
import { Screening } from '../types'
import { titleCase } from './utils/titleCase'

const logger = parentLogger.createChild({
  persistentLogAttributes: {
    scraper: 'cinecitta',
  },
})

// e.g. 2023-10-06T19:00:00 in Amsterdam time -> 2023-10-06T17:00:00Z
const extractDate = (time: string) =>
  DateTime.fromISO(time, { zone: 'Europe/Amsterdam' }).toUTC().toJSDate()

type WpJsonMovie = {
  id: number
  title: { rendered: string }
  link: string
  movie_sync_id: number
  language_subtitles: string
  status_other: string
}

type ShowJson = {
  id: number
  start: string
}

const ENGLISH_SUBTITLES_REGEX =
  /\s+\(English Subtitles\)$|^Eng\s+|^Expat Cinema:\s+| \(EN\)$/i

const hasEnglishSubtitles = (movie: WpJsonMovie) => {
  const titleDescribesEnglishSubtitles = ENGLISH_SUBTITLES_REGEX.test(
    movie.title.rendered,
  )

  const metadataHasEnglishSubtitles =
    movie.language_subtitles?.toLowerCase() === 'engels' ||
    movie.language_subtitles?.toLowerCase() === 'english' ||
    movie.status_other?.toLowerCase() === 'english subtitled'

  return titleDescribesEnglishSubtitles || metadataHasEnglishSubtitles
}

const cleanTitle = (movie: WpJsonMovie) => {
  return titleCase(
    decode(movie.title.rendered.replace(ENGLISH_SUBTITLES_REGEX, '')),
  )
}

const extractFromMainPage = async (): Promise<Screening[]> => {
  try {
    const movies: WpJsonMovie[] = await got(
      'https://cinecitta.nl/wp-json/wp/v2/movie?with_shows=true&type=&movie_post_id=&lang=en',
    ).json()

    logger.info('movies found', { movies })

    const moviesWithEnglishSubtitles = movies.filter(hasEnglishSubtitles)

    logger.info('movies with english subtitles', { moviesWithEnglishSubtitles })

    const screenings: Screening[][] = (
      await Promise.all(
        moviesWithEnglishSubtitles.map(async (movie) => {
          const shows: ShowJson[] = await got(
            `https://cinecitta.nl/rest-api/v1/wordpress-integration/shows/?format=json&movie_sync_id=${movie.movie_sync_id}`,
          ).json()

          return shows.map((show) => {
            return {
              title: cleanTitle(movie),
              url: movie.link,
              cinema: 'Cinecitta',
              date: extractDate(show.start),
            }
          })
        }),
      )
    ).filter((x) => x)

    logger.info('before flatten', { screenings })

    return screenings.flat()
  } catch (error) {
    logger.error('error scraping cinecitta', { error })
    return []
  }
}

if (require.main === module) {
  extractFromMainPage()
    .then((x) => JSON.stringify(x, null, 2))
    .then(console.log)
}

export default extractFromMainPage

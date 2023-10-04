import { DateTime } from 'luxon'
import got from 'got'

import { Screening } from '../types'
import { logger as parentLogger } from '../powertools'

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
}

type ShowJson = {
  id: number
  start: string
}

const ENGLISH_SUBTITLES_REGEX = /\s+\(English Subtitles\)$/i

const hasEnglishSubtitles = (movie: WpJsonMovie) => {
  return ENGLISH_SUBTITLES_REGEX.test(movie.title.rendered)
}

const cleanTitle = (movie: WpJsonMovie) => {
  return movie.title.rendered.replace(ENGLISH_SUBTITLES_REGEX, '')
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
  }
}

if (require.main === module) {
  extractFromMainPage()
    .then((x) => JSON.stringify(x, null, 2))
    .then(console.log)
}

export default extractFromMainPage

// like Bioscopenleiden
import { DateTime } from 'luxon'
import got from 'got'
import { decode } from 'html-entities'

import { Screening } from '../types'
import { logger as parentLogger } from '../powertools'

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
            title: decode(movie.title),
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

if (require.main === module) {
  extractFromMainPage()
    .then((x) => JSON.stringify(x, null, 2))
    .then(console.log)
}

export default extractFromMainPage

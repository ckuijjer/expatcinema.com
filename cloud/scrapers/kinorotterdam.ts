import { DateTime } from 'luxon'
import got from 'got'

import { Screening } from '../types'
import { logger as parentLogger } from '../powertools'

const logger = parentLogger.createChild({
  persistentLogAttributes: {
    scraper: 'kinorotterdam',
  },
})

// e.g. 202210181005
const extractDate = (time: string) => DateTime.fromFormat(time, 'yyyyMMddHHmm')

type FkFeedItem = {
  title: string
  language: { label: string; value: string }
  permalink: string
  times: { program_start: string; program_end: string }[]
}

const hasEnglishSubtitles = (movie: FkFeedItem) => {
  return movie.language.value === 'English' || movie.language.value === 'Engels'
}

const extractFromMainPage = async (): Promise<Screening[]> => {
  const movies = Object.values<FkFeedItem>(
    await got('https://kinorotterdam.nl/fk-feed/agenda').json(),
  )

  logger.info('main page', { movies })

  const filteredMovies = movies.filter(hasEnglishSubtitles)

  logger.info('main page with english subtitles', { filteredMovies })

  const screenings: Screening[][] = filteredMovies
    .map((movie) => {
      return movie.times?.map((time) => {
        return {
          title: movie.title,
          url: movie.permalink,
          cinema: 'Kino Rotterdam',
          date: extractDate(time.program_start).toJSDate(),
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

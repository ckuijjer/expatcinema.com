import { DateTime } from 'luxon'
import got from 'got'

import { Screening } from '../types'
import { logger as parentLogger } from 'powertools'

const logger = parentLogger.createChild({
  persistentLogAttributes: {
    scraper: 'bioscopenleiden',
  },
})

type BioscopenLeidenAPIResponse = {
  [key: string]: BioscopenLeidenMovie
}

type BioscopenLeidenMovie = {
  post_id: number
  title: string
  starring_short: string
  synopsis: string
  image: string
  poster: string
  classification: string[]
  spoken_language: {
    label: string
    value: string
  }
  language: {
    label: string
    value: string
  }
  director_name: {
    label: string
    value: string
  }
  duration: {
    label: string
    value: string
  }
  tags: {
    expected: string
  }
  review: boolean
  permalink: string
  poster_small: string
  dates: {
    cinema_id: number
    release: string
    last_week: string
  }
  times?: {
    child_id: number
    provider_id: string
    program_start: string
    program_end: string
    ticket_status: string
    cinema_id: number
    location: string
    tags: string[]
    duration: string
  }[]
}

const extractFromMainPage = async (): Promise<Screening[]> => {
  const apiResponse: BioscopenLeidenAPIResponse = await got(
    'https://bioscopenleiden.nl/fk-feed/agenda',
  ).json()

  logger.info('extracted api response', { apiResponse })

  const moviesWithEnglishSubtitlesTimes: BioscopenLeidenMovie[] = Object.values(
    apiResponse,
  )
    // first filter out times that don't have a 'en subs' tag
    .map((movie: BioscopenLeidenMovie) => {
      return {
        ...movie,
        times: movie.times?.filter((time) =>
          time.tags.map((x) => x.toLowerCase()).includes('en subs'),
        ),
      }
    })
    .filter((movie: BioscopenLeidenMovie) => movie.times?.length > 0)

  logger.info('movies with times having english subtitles', {
    moviesWithEnglishSubtitlesTimes,
  })

  const screenings = moviesWithEnglishSubtitlesTimes.flatMap((movie) => {
    return movie.times.map((time) => {
      const screening = {
        title: movie.title,
        url: movie.permalink,
        cinema: 'Kijkhuis', // assumes all bioscopenleiden movies are in Kijkhuis
        date: DateTime.fromFormat(
          time.program_start,
          'yyyyMMddHHmm',
        ).toJSDate(),
      }
      return screening
    })
  })

  logger.info('extracted screenings', { screenings })

  return screenings
}

if (require.main === module) {
  const sort = R.sortWith([
    (a, b) => DateTime.fromISO(a.date) - DateTime.fromISO(b.date),
    R.ascend(R.prop('cinema')),
    R.ascend(R.prop('title')),
    R.ascend(R.prop('url')),
  ])

  extractFromMainPage()
    .then(sort)
    .then((x) => JSON.stringify(x, null, 2))
    .then(console.log)

  // extractFromMoviePage({
  // url: 'https://www.filmhuisdenhaag.nl/agenda/event/styx',
  // }).then(console.log)
}

export default extractFromMainPage

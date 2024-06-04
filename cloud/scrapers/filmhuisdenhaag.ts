import got from 'got'
import { DateTime } from 'luxon'

import { logger as parentLogger } from '../powertools'
import { Screening } from '../types'
import { makeScreeningsUniqueAndSorted } from './utils/makeScreeningsUniqueAndSorted'
import { splitTime } from './utils/splitTime'

const logger = parentLogger.createChild({
  persistentLogAttributes: {
    scraper: 'filmhuisdenhaag',
  },
})

type FilmhuisDenhaagAPIResponse = {
  [date: string]: {
    date: string
    day: string
    day_month: string
    films: {
      [id: string]: {
        title: string
        image: string
        poster: string
        poster_fit: boolean
        description: string
        director: string
        duration: string
        location: string
        subtitle: string
        uri: string
        category: string[]
        genre: string
        kijkwijzer: string[]
        programs: {
          id: number
          past: boolean
          starts_at_time: string
          starts_at_date: string
          starts_at_day: string
          starts_at_day_month: string
          availability: string
          is_tickets_available: boolean
          is_last_tickets: boolean
          is_sold_out: boolean
          is_free: boolean
          tickets_left: number
          ticket_url: string
          location: string
          expected: number
          cancelled: number
          rescheduled: number
          label: string
          subs: string
          online: number
          ticket_status: {
            css_class: string
            title: string
          }
        }[]
      }
    }
  }
}

const cleanTitle = (title: string) =>
  title
    .replace(/ - EN subs$/i, '') // remove subs from the title
    .replace(/ -(.*?)$/, '') // actually remove the last dash and everything after it (bit questionable)

const extractFromMainPage = async (): Promise<Screening[]> => {
  const apiResponse: FilmhuisDenhaagAPIResponse = await got(
    'https://filmhuisdenhaag.nl/api/program',
  ).json()

  logger.info('extracted api response', { apiResponse })

  // make a flat list of all screenings
  const programs = Object.values(apiResponse)
    .map((item) => item.films)
    .flatMap((film) => Object.values(film))
    .flatMap((film) => {
      const { programs, ...rest } = film
      return film.programs.map((program) => ({
        ...rest,
        ...program,
      }))
    })

  const screenings: Screening[] = programs
    // .filter((item) => item.subtitle === 'Engels' || item.subtitle === 'English') // removed as it seems to always show "Nederlands" now
    .filter((item) => item.subs === 'EN subs')
    .map((item) => {
      const [year, month, day] = item.starts_at_date
        .split('-')
        .map((x) => Number(x))
      const [hour, minute] = splitTime(item.starts_at_time)

      return {
        title: cleanTitle(item.title),
        url: `https://filmhuisdenhaag.nl${item.uri}`,
        cinema: 'Filmhuis Den Haag',
        date: DateTime.fromObject({
          year,
          month,
          day,
          hour,
          minute,
        }).toJSDate(),
      }
    })

  const uniqueSortedScreenings = makeScreeningsUniqueAndSorted(screenings)

  logger.info('extracted screenings', { screenings: uniqueSortedScreenings })
  return uniqueSortedScreenings
}

if (require.main === module) {
  extractFromMainPage()
    .then((x) => JSON.stringify(x, null, 2))
    .then(console.log)
  // extractFromMoviePage({
  // url: 'https://www.filmhuisdenhaag.nl/agenda/event/styx',
  // }).then(console.log)
}

export default extractFromMainPage

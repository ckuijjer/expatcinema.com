import got from 'got'
import { DateTime } from 'luxon'
import Xray from 'x-ray'

import { logger as parentLogger } from '../powertools'
import { Screening } from '../types'
import { makeScreeningsUniqueAndSorted } from './utils/makeScreeningsUniqueAndSorted'
import { runIfMain } from './utils/runIfMain'
import { splitTime } from './utils/splitTime'
import { titleCase } from './utils/titleCase'

const logger = parentLogger.createChild({
  persistentLogAttributes: {
    scraper: 'filmhuisdenhaag',
  },
})

const xray = Xray({
  filters: {
    normalizeWhitespace: (value) =>
      typeof value === 'string' ? value.replace(/\s+/g, ' ') : value,
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
  titleCase(
    title
      .replace(/ - EN subs$/i, '') // remove subs from the title
      .replace(
        /\s+\((?:4K Restoration|Re-Release)\)(?:\s+-\s+Late Night Anime)?$/i,
        '',
      ), // remove presentation-only suffixes
  )

const hasEnglishSubtitles = (item) => {
  return (
    item.subtitle === 'Engels' ||
    item.subtitle === 'English' ||
    item.characteristics.includes('EN subs')
  )
}

const parseReleaseYear = (metadata: string[]) => {
  const match = metadata
    .map((entry) => entry.match(/\b((?:19|20)\d{2})\b/))
    .find(Boolean)

  return match?.[1] ? Number(match[1]) : undefined
}

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

  const releaseYearByUrl = new Map(
    await Promise.all(
      Array.from(
        new Set(
          programs.map((item) => `https://filmhuisdenhaag.nl${item.uri}`),
        ),
      ).map(async (url) => {
        const detailPage = await xray(url, {
          metadata: ['aside .flex.flex-col.space-y-2 p | normalizeWhitespace'],
        })

        return [url, parseReleaseYear(detailPage.metadata ?? [])] as const
      }),
    ),
  )

  const screenings: Screening[] = programs
    .filter(hasEnglishSubtitles)
    .map((item) => {
      const [year, month, day] = item.starts_at_date
        .split('-')
        .map((x) => Number(x))
      const [hour, minute] = splitTime(item.starts_at_time)

      return {
        title: cleanTitle(item.title),
        year: releaseYearByUrl.get(`https://filmhuisdenhaag.nl${item.uri}`),
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

runIfMain(extractFromMainPage, import.meta.url)

export default extractFromMainPage

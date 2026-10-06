import got from 'got'
import { DateTime } from 'luxon'

import { logger as parentLogger } from '../powertools'
import { Screening } from '../types'
import { makeScreeningsUniqueAndSorted } from './utils/makeScreeningsUniqueAndSorted'
import { splitTime } from './utils/splitTime'
import { createXray } from '../xRay'

const logger = parentLogger.createChild({
  persistentLogAttributes: {
    scraper: 'filmhuisdenhaag',
  },
})

const xray = createXray({ logger })

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

type ProgramItem = {
  title: string
  subtitle?: string
  characteristics?: string[]
  uri: string
  starts_at_date: string
  starts_at_time: string
}

// Filmhuis Den Haag adds the series, label or event to a title after " - ", and
// the suffixes stack: "Lamb - Gather Round Folks - EN subs", "Youri - met Q&A".
// Cutting at the first " - " would also cut the subtitle of a film such as
// "Mission: Impossible - Fallout", which then no longer matches on TMDB. So only
// a suffix that is a format label, a festival, a known series, or shared by more
// than one film of the programme (a series, as opposed to the subtitle of one
// film) goes.
const FORMAT_LABEL = /^(?:EN subs\b.*|met\s.+)$/i

// e.g. "No Limits Festival", "Festival Dag in de Branding"
const FESTIVAL_LABEL = /\bfestival\b/i

const KNOWN_SERIES = [
  'Laff',
  'Drank & Drugs',
  'This Is Not Funny',
  'Is This Bruce Lee?',
  'Ciné Première',
  'Late Night Anime',
  'First Pick',
]

const splitTitle = (title: string) => title.split(/\s+-\s+/)

// Case and spacing don't count: "No Lonely Dancefloors" and "No Lonely Dance Floors"
const labelKey = (label: string) => label.toLowerCase().replace(/\s+/g, '')

const KNOWN_SERIES_KEYS = new Set(KNOWN_SERIES.map(labelKey))

// The suffixes that more than one film of the programme has, e.g. "LIFF"
export const findSeriesLabels = (titles: string[]) => {
  const films = new Map<string, number>()

  for (const title of new Set(titles)) {
    for (const key of new Set(splitTitle(title).slice(1).map(labelKey))) {
      films.set(key, (films.get(key) ?? 0) + 1)
    }
  }

  return new Set(
    [...films].filter(([, count]) => count > 1).map(([key]) => key),
  )
}

export const cleanTitle = (title: string, seriesLabels: Set<string>) => {
  const [film, ...suffixes] = splitTitle(title)

  const firstLabel = suffixes.findIndex(
    (suffix) =>
      FORMAT_LABEL.test(suffix) ||
      FESTIVAL_LABEL.test(suffix) ||
      KNOWN_SERIES_KEYS.has(labelKey(suffix)) ||
      seriesLabels.has(labelKey(suffix)),
  )

  return [
    film,
    ...(firstLabel === -1 ? suffixes : suffixes.slice(0, firstLabel)),
  ]
    .join(' - ')
    .replace(/\s+\((4K Restoration|Re-Release)\)$/i, '')
    .trim()
}

const hasEnglishSubtitles = (item: ProgramItem) => {
  return (
    item.subtitle === 'Engels' ||
    item.subtitle === 'English' ||
    (item.characteristics ?? []).includes('EN subs')
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

  logger.debug('extracted api response', { apiResponse })

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

  const seriesLabels = findSeriesLabels(programs.map(({ title }) => title))

  const screenings: Screening[] = programs
    .filter(hasEnglishSubtitles)
    .map((item) => {
      const [year, month, day] = item.starts_at_date
        .split('-')
        .map((x: string) => Number(x))
      const [hour, minute] = splitTime(item.starts_at_time)

      return {
        title: cleanTitle(item.title, seriesLabels),
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

  logger.debug('extracted screenings', { screenings: uniqueSortedScreenings })
  return uniqueSortedScreenings
}

export default extractFromMainPage

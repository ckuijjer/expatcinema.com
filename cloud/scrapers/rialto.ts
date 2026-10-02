import got from 'got'
import { DateTime } from 'luxon'

import { logger as parentLogger } from '../powertools'
import { Screening } from '../types'

const logger = parentLogger.createChild({
  persistentLogAttributes: {
    scraper: 'rialto',
  },
})

// Rialto De Pijp's site (depijp.rialtofilm.nl) is a Nuxt app backed by a JSON
// API. POSTing to /events returns every film with all its screenings
// ("programs"), and each screening carries attributes such as "Eng subs".
const BASE_URL = 'https://depijp.rialtofilm.nl'
const EVENTS_API_URL = `${BASE_URL}/prod/en/api/events`

type RialtoProgram = {
  startAt: string // local time without offset, e.g. 2026-10-05T21:15:00
  isCanceled: boolean
  attributes?: { name: string }[]
}

type RialtoEvent = {
  url: string // e.g. /en/films/coward
  title: string
  fields?: { productionYear?: string }
  programs?: RialtoProgram[]
}

type RialtoEventsResponse = {
  events: RialtoEvent[]
  pagination: { count: number; pages: number }
}

const hasEnglishSubtitles = ({ attributes }: RialtoProgram) =>
  (attributes ?? []).some(({ name }) => /^eng(lish)? sub/i.test(name))

const parseYear = (year?: string) => {
  const parsed = Number(year)
  return Number.isInteger(parsed) && parsed > 1880 ? parsed : undefined
}

const PAGE_SIZE = 100 // the API rejects larger pages with a 400

const fetchEventsPage = (page: number) =>
  got
    .post(EVENTS_API_URL, {
      json: { pagination: { page, pageSize: PAGE_SIZE } },
    })
    .json<RialtoEventsResponse>()

const fetchAllEvents = async () => {
  const firstPage = await fetchEventsPage(1)
  const events = [...firstPage.events]

  for (let page = 2; page <= firstPage.pagination.pages; page++) {
    events.push(...(await fetchEventsPage(page)).events)
  }

  return events
}

const extractFromMainPage = async (): Promise<Screening[]> => {
  const events = await fetchAllEvents()

  const screenings: Screening[] = events.flatMap((event) =>
    (event.programs ?? [])
      .filter((program) => !program.isCanceled && hasEnglishSubtitles(program))
      .map((program) => ({
        title: event.title,
        year: parseYear(event.fields?.productionYear),
        url: new URL(event.url, BASE_URL).toString(),
        cinema: 'Rialto De Pijp',
        date: DateTime.fromISO(program.startAt, {
          zone: 'Europe/Amsterdam',
        }).toJSDate(),
      })),
  )

  logger.debug('screenings', { screenings })

  return screenings
}

export default extractFromMainPage

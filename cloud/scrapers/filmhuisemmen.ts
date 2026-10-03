import { DateTime } from 'luxon'

import { logger as parentLogger } from '../powertools'
import { Screening } from '../types'
import { createXray } from '../xRay'
import { extractScreeningsFromPages } from './utils/extractScreeningsFromPages'
import { makeScreeningsUniqueAndSorted } from './utils/makeScreeningsUniqueAndSorted'
import { fullMonthToNumberDutch } from './utils/monthToNumber'
import { splitTime } from './utils/splitTime'
import { titleCase } from './utils/titleCase'

const logger = parentLogger.createChild({
  persistentLogAttributes: {
    scraper: 'filmhuisemmen',
  },
})

const xray = createXray({ logger })

// Filmhuis Emmen shows one film a week (Mondays and Tuesdays). /programma/
// lists the coming films, each as a card with a heading that holds the title,
// the date and the start time, and a few details:
//
//   <a href=".../the-invite/" title="The Invite<br>Dinsdag 13 oktober 2026<br>Aanvang: 19:15 uur">
//   <div class="customfields">Land: VS, 2026</div>
//
// The programme page doesn't say anything about subtitles. When a film is
// subtitled in English, its own page says so in the description:
// "LET OP: ENGELS ONDERTITELD". That is very rare: in the archive of the
// last 7 seasons it happens once (I Never Cry, 2021-22).
const PROGRAMME_URL = 'https://www.filmhuisemmen.nl/programma/'

type XRayFromProgramme = {
  url: string
  heading: string
  details: string[]
}

type XRayFromFilmPage = {
  description: string[]
}

type ProgrammeEntry = {
  title: string
  url: string
  date: Date
  year?: number
}

// 'The Invite<br>Dinsdag 13 oktober 2026<br>Aanvang: 19:15 uur'
//   -> { title: 'The Invite', date: 2026-10-13T17:15:00Z }
export const parseHeading = (heading: string) => {
  const [title, dateLine, timeLine] = heading
    .split('<br>')
    .map((part) => part.trim())

  const dateMatch = dateLine?.match(/(\d{1,2})\s+([a-zë]+)\s+(\d{4})/i)
  const timeMatch = timeLine?.match(/\d{1,2}[:.]\d{2}/)
  if (!title || !dateMatch || !timeMatch) return undefined

  const [, day, monthName, year] = dateMatch
  const [hour, minute] = splitTime(timeMatch[0])

  const date = DateTime.fromObject(
    {
      year: Number(year),
      month: fullMonthToNumberDutch(monthName),
      day: Number(day),
      hour,
      minute,
    },
    { zone: 'Europe/Amsterdam' },
  )

  return date.isValid ? { title, date: date.toJSDate() } : undefined
}

// 'Land: Frankrijk, 2025' -> 2025
export const extractYear = (details: string[]) => {
  const year = details
    .find((detail) => detail.startsWith('Land:'))
    ?.split(',')
    .map((part) => part.trim())
    .pop()

  return year && /^(?:19|20)\d{2}$/.test(year) ? Number(year) : undefined
}

export const hasEnglishSubtitles = (description: string) =>
  /ENGELS ONDERTITELD/i.test(description)

export const cleanTitle = (title: string) => titleCase(title.trim())

const extractFromFilmPage = async (
  entry: ProgrammeEntry,
): Promise<Screening[]> => {
  const { description }: XRayFromFilmPage = await xray(entry.url, {
    description: ['.entry-content p | normalizeWhitespace | trim'],
  })

  if (!hasEnglishSubtitles((description ?? []).join(' '))) return []

  return [
    {
      title: cleanTitle(entry.title),
      year: entry.year,
      url: entry.url,
      cinema: 'Filmhuis Emmen',
      date: entry.date,
    },
  ]
}

const extractFromMainPage = async (): Promise<Screening[]> => {
  const cards: XRayFromProgramme[] = await xray(PROGRAMME_URL, '#actueel li', [
    {
      url: 'h1.link-naar-meer a@href',
      heading: 'a@title',
      details: ['.customfields | normalizeWhitespace | trim'],
    },
  ])

  // The page lists every film twice
  const entries: ProgrammeEntry[] = []
  const seen = new Set<string>()
  for (const { url, heading, details } of cards) {
    const key = `${url} ${heading}`
    if (!url || seen.has(key)) continue
    seen.add(key)

    const parsed = parseHeading(heading ?? '')
    if (!parsed) {
      logger.warn('skipping programme entry without a title or date', {
        url,
        heading,
      })
      continue
    }

    entries.push({ ...parsed, url, year: extractYear(details ?? []) })
  }

  logger.debug('programme entries', { entries })

  if (entries.length === 0) {
    logger.warn('no films found in the programme')
  }

  const screenings = await extractScreeningsFromPages(
    entries,
    extractFromFilmPage,
    { logger, url: ({ url }) => url },
  )

  logger.debug('screenings', { screenings })

  return makeScreeningsUniqueAndSorted(screenings)
}

export default extractFromMainPage

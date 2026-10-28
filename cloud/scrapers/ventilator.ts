import got from 'got'
import { decode } from 'html-entities'
import { DateTime } from 'luxon'

import { logger as parentLogger } from '../powertools'
import { Screening } from '../types'
import { cleanDirector } from './utils/cleanDirector'
import { extractScreeningsFromPages } from './utils/extractScreeningsFromPages'
import { makeScreeningsUniqueAndSorted } from './utils/makeScreeningsUniqueAndSorted'
import { titleCase } from './utils/titleCase'
import { warnIfEmpty } from './utils/warnIfEmpty'

const logger = parentLogger.createChild({
  persistentLogAttributes: {
    scraper: 'ventilator',
  },
})

// Ventilator Cinema is run by Amsterdam Alternative on the 2nd floor of the
// OT301, and is listed in the agenda of amsterdamalternative.nl. That agenda
// is filled by a JSON endpoint, as on the site's own /ventilator page: venue
// 105 is the OT301, rooms 4 and 5 are its bar and cinema. It has no
// description, so the page of each film is read for the English subtitles.
const AGENDA_URL =
  'https://amsterdamalternative.nl/services/get-events-past-v25.php'

const MONTHS = 6

// Screenings that have English subtitles although their page doesn't say so,
// by the id in the url of the event page (amsterdamalternative.nl/agenda/<id>),
// with where it comes from
export const ENGLISH_SUBTITLES_OVERRIDES = new Map<number, string>([
  [
    23253,
    "Inn a State of Siege: the film's producer wrote that it is screened with English subtitles (email, 2026-10-28); its page has no word on subtitles or language",
  ],
])

type AgendaItem = {
  id: number
  // seconds since the epoch
  start: number
  title: string
  type: { label: string }
}

type AgendaResponse = {
  items: AgendaItem[]
}

// 'Fangs (Anyab) halloween screening' -> 'Fangs (Anyab)'
// 'Ventilator Cinema presents: Inn a State of Siege (Special Screening)' -> 'Inn a State of Siege'
const cleanTitle = (title: string) =>
  decode(title)
    .replace(/^Ventilator Cinema presents:\s*/i, '')
    .replace(/\s+\((?:special )?screening\)$/i, '')
    .replace(/\s+halloween screening$/i, '')
    .trim()

// The film page is free text, in paragraphs with <br> between the lines
//
//   Title: Memory of Princess Mumbi
//   Director: Damien Hauser
//   Year: 2025
//   Language: English with English subtitles
//
// or, for Fangs (Anyab): '(1981, 1h 40m, Arabic, w/ English Subtitles) dir Mohammed Shebl)'
export const extractPageText = (html: string) =>
  decode(
    (
      html.match(/<article class="body agenda">([\s\S]*?)<\/article>/)?.[1] ??
      ''
    )
      .replace(/<br\s*\/?>|<\/p>/gi, '\n')
      .replace(/<[^>]+>/g, ''),
  )
    .replace(/[ \t ]+/g, ' ')
    .replace(/ ?\n ?/g, '\n')

// 'Language: Maltese with English subtitles', 'Arabic, w/ English Subtitles'
export const hasEnglishSubtitles = (text: string) =>
  /\bEnglish sub(?:title)?s\b/i.test(text)

export const parseTitle = (eventTitle: string, text: string) =>
  titleCase(
    text.match(/^Title:\s*(.+)$/m)?.[1].trim() ?? cleanTitle(eventTitle),
  )

export const parseYear = (text: string) => {
  const year =
    text.match(/^Year:\s*(\d{4})\b/m)?.[1] ?? text.match(/\((\d{4}),/)?.[1]

  return year ? Number(year) : undefined
}

export const parseDirector = (text: string) =>
  cleanDirector(
    text.match(/^Director:\s*(.+)$/m)?.[1] ??
      text.match(/\bdir\.? ([^)\n]+)/)?.[1],
  )

const extractFromEventPage = async ({
  id,
  start,
  title,
}: AgendaItem): Promise<Screening[]> => {
  const url = `https://amsterdamalternative.nl/agenda/${id}`
  const text = extractPageText(await got(url).text())

  logger.debug('event page', { url, text })

  if (!ENGLISH_SUBTITLES_OVERRIDES.has(id) && !hasEnglishSubtitles(text)) {
    return []
  }

  return [
    {
      title: parseTitle(title, text),
      year: parseYear(text),
      director: parseDirector(text),
      url,
      cinema: 'Ventilator Cinema',
      date: new Date(start * 1000),
    },
  ]
}

const extractFromMainPage = async (): Promise<Screening[]> => {
  const { items }: AgendaResponse = await got(AGENDA_URL, {
    searchParams: {
      venue: 105,
      room: '4,5',
      month: DateTime.now().setZone('Europe/Amsterdam').month,
      months: MONTHS,
      limit: 100,
    },
  }).json()

  // The bar, talks and theatre of the OT301 are in the agenda too
  const films = items.filter(({ type }) => type.label === 'Film')

  logger.debug('films', { films })

  const screenings = makeScreeningsUniqueAndSorted(
    await extractScreeningsFromPages(films, extractFromEventPage, {
      logger,
      url: ({ id }) => `https://amsterdamalternative.nl/agenda/${id}`,
      concurrency: 3,
    }),
  )

  warnIfEmpty(logger, {
    listed: items.length,
    subtitled: screenings.length,
    screenings: screenings.length,
  })

  return screenings
}

export default extractFromMainPage

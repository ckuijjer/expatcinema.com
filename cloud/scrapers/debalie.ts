import got from 'got'
import { DateTime } from 'luxon'

import { logger as parentLogger } from '../powertools'
import { Screening } from '../types'
import { USER_AGENT, createXray } from '../xRay'
import { extractScreeningsFromPages } from './utils/extractScreeningsFromPages'
import { makeScreeningsUniqueAndSorted } from './utils/makeScreeningsUniqueAndSorted'
import { titleCase } from './utils/titleCase'

const logger = parentLogger.createChild({
  persistentLogAttributes: {
    scraper: 'debalie',
  },
})

const xray = createXray({ logger })

// De Balie's programme page (https://debalie.nl/cinema/) fills itself with
// JavaScript, but the films it shows are the `vo-cinema` posts of the site's
// WordPress REST API. Every film has its own page with the screenings as ticket
// links, and its details as label/value items:
//
//   <div class="wp-block-vo-info-item">
//     <dt class="wp-block-vo-info-item__subtitle">Ondertitels</dt>
//     <dd><span class="wp-block-vo-info-item__text">ENG</span></dd>
//   </div>
//   <div class="banner-bar__links" data-ticket-selector-day="20261003">
//     <a class="banner-bar__link" href=".../tickets/11839586">17:45</a>
//   </div>
const MOVIES_URL =
  'https://debalie.nl/wp-json/wp/v2/vo-cinema?page=1&per_page=100&_fields=link'

const SUBTITLES_LABEL = /^(?:ondertitels|ondertiteling|subtitles)$/i
const YEAR_LABEL = /^(?:jaar|year)$/i

type InfoItem = {
  label: string
  value: string
}

type Ticket = {
  day: string
  time: string
}

type XRayFromMoviePage = {
  title: string
  info: InfoItem[]
  paragraphs: string[]
  tickets: Ticket[]
}

// The subtitles are listed as language codes: 'NL', 'ENG', or 'NL, ENG'
export const parseSubtitleLanguages = (value: string) =>
  value
    .toUpperCase()
    .split(/[,&/]|\sEN\s/)
    .map((language) => language.trim())
    .filter(Boolean)

const WEEKDAYS = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
]

type EnglishSubtitlesRule = {
  weekdays: number[] // luxon weekdays, 1 = Monday ... 7 = Sunday
  time?: string // e.g. '20:30', when the rule is only for one showtime
}

// A film with 'NL, ENG' subtitles is only shown with English subtitles at some
// screenings, which the page says in a sentence, e.g. "The screening of Amigo
// Secreto will be with English subtitles on Tuesdays and Saturdays at 20:30"
export const parseEnglishSubtitlesRule = (
  paragraphs: string[],
): EnglishSubtitlesRule | undefined => {
  for (const paragraph of paragraphs) {
    const match = paragraph.match(
      /English subtitles on ((?:\w+days?)(?:\s*(?:,|and|&)\s*\w+days?)*)(?:\s+at\s+(\d{1,2}[:.]\d{2}))?/i,
    )
    if (!match) continue

    const weekdays = (match[1].toLowerCase().match(/\w+days?/g) ?? [])
      .map((name) =>
        WEEKDAYS.findIndex((weekday) => weekday === name.replace(/s$/, '')),
      )
      .filter((index) => index >= 0)
      .map((index) => index + 1)

    if (weekdays.length === 0) continue

    return {
      weekdays,
      time: match[2]?.replace('.', ':').padStart(5, '0'),
    }
  }

  return undefined
}

// Explicit per screening: only the subtitle language codes and the sentence
// above count, never a guess from the rest of the page
export const hasEnglishSubtitles = (
  languages: string[],
  rule: EnglishSubtitlesRule | undefined,
  date: DateTime,
) => {
  if (!languages.includes('ENG')) return false

  // 'ENG' alone: every screening
  if (!languages.includes('NL')) return true

  // 'NL, ENG': only the screenings the page names
  if (!rule) return false

  return (
    rule.weekdays.includes(date.weekday) &&
    (!rule.time || rule.time === date.toFormat('HH:mm'))
  )
}

// e.g. day '20261003', time '17:45'
export const parseDate = (day: string, time: string) => {
  const date = DateTime.fromFormat(`${day} ${time.trim()}`, 'yyyyLLdd H:mm', {
    zone: 'Europe/Amsterdam',
  })

  return date.isValid ? date : undefined
}

// Drop the series a film is part of, e.g.
// "Amsterdam Polish Film Festival: Afterimage" and "CinéDialoog: Caméra d’Afrique"
export const cleanTitle = (title: string) =>
  titleCase(
    title
      .replace(/^(?:Amsterdam Polish Film Festival|CinéDialoog):\s+/i, '')
      .trim(),
  )

export const extractYear = (info: InfoItem[]) => {
  const year = info.find(({ label }) => YEAR_LABEL.test(label))?.value

  return year && /^(?:19|20)\d{2}$/.test(year) ? Number(year) : undefined
}

export const extractScreeningsFromMovieHtml = async (
  html: string,
  url: string,
): Promise<Screening[]> => {
  const movie: XRayFromMoviePage = await xray(html, {
    title: 'h1 | normalizeWhitespace | trim',
    info: xray('.wp-block-vo-info-item', [
      {
        label: '.wp-block-vo-info-item__subtitle | normalizeWhitespace | trim',
        value: '.wp-block-vo-info-item__text | normalizeWhitespace | trim',
      },
    ]),
    paragraphs: ['.entry__content p | normalizeWhitespace | trim'],
    tickets: xray('[data-ticket-selector-day]', [
      {
        day: '@data-ticket-selector-day | trim',
        time: '.banner-bar__link | normalizeWhitespace | trim',
      },
    ]),
  })

  const info = movie.info ?? []
  const tickets = movie.tickets ?? []

  if (!movie.title || tickets.length === 0) {
    logger.debug('no title or no screenings on sale', { url })
    return []
  }

  const subtitles = info.find(({ label }) => SUBTITLES_LABEL.test(label))
  const languages = parseSubtitleLanguages(subtitles?.value ?? '')
  const rule = parseEnglishSubtitlesRule(movie.paragraphs ?? [])
  const year = extractYear(info)

  return tickets.flatMap(({ day, time }) => {
    const date = parseDate(day, time)

    if (!date) {
      logger.warn('skipping screening with an unknown date', { url, day, time })
      return []
    }

    if (!hasEnglishSubtitles(languages, rule, date)) return []

    return [
      {
        title: cleanTitle(movie.title),
        year,
        url,
        cinema: 'De Balie',
        date: date.toJSDate(),
      },
    ]
  })
}

const extractFromMoviePage = async (url: string) =>
  extractScreeningsFromMovieHtml(
    await got(url, {
      headers: { 'user-agent': USER_AGENT },
      timeout: { request: 30_000 },
      retry: { limit: 2, maxRetryAfter: 10_000 },
    }).text(),
    url,
  )

const extractFromMainPage = async (): Promise<Screening[]> => {
  const movies = await got(MOVIES_URL, {
    headers: { 'user-agent': USER_AGENT },
    timeout: { request: 30_000 },
    retry: { limit: 2, maxRetryAfter: 10_000 },
  }).json<{ link?: string }[]>()

  const urls = Array.from(
    new Set(movies.flatMap(({ link }) => (link ? [link] : []))),
  )

  logger.debug('movie pages', { urls })

  if (urls.length === 0) {
    logger.warn('no films found in the programme')
  }

  const screenings = await extractScreeningsFromPages(
    urls,
    extractFromMoviePage,
    { logger },
  )

  logger.debug('screenings', { screenings })

  return makeScreeningsUniqueAndSorted(screenings)
}

export default extractFromMainPage

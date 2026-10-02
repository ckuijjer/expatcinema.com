import got from 'got'
import { decode } from 'html-entities'
import { DateTime } from 'luxon'
import pMap from 'p-map'

import { logger as parentLogger } from '../powertools'
import { Screening } from '../types'
import { extractScreeningsFromPages } from './utils/extractScreeningsFromPages'
import { makeScreeningsUniqueAndSorted } from './utils/makeScreeningsUniqueAndSorted'
import { titleCase } from './utils/titleCase'

const logger = parentLogger.createChild({
  persistentLogAttributes: {
    scraper: 'rialtovu',
  },
})

// Rialto VU Griffioen, on the VU campus, runs on the VU's own ticketing
// system rather than Rialto's API. shows.php returns the film programme as an
// HTML fragment with one link per film (to its next screening). Every
// screening has its own page, e.g. /film/naza/03-10-2026-19-00, which lists
// all screenings of that film in a dropdown and states the subtitles of that
// particular screening ("Ondertiteling: Engels"). Subtitles can differ per
// screening, so each screening page is read.
const BASE_URL = 'https://griffioen.vu.nl'

type ShowsResponse = {
  html: string
  pages: number
}

const fetchFilmUrls = async () => {
  const fetchPage = (page: number) =>
    got(`${BASE_URL}/shows.php`, {
      searchParams: { genres: '', dates: '', type: 'film', page },
    }).json<ShowsResponse>()

  const first = await fetchPage(1)
  const pages = [first]
  for (let page = 2; page <= first.pages; page++) {
    pages.push(await fetchPage(page))
  }

  const urls = pages.flatMap(({ html }) =>
    Array.from(html.matchAll(/document\.location='([^']+)'/g), ([, path]) =>
      new URL(path.replace(/\\\//g, '/'), BASE_URL).toString(),
    ),
  )

  // The listing can link to the same film more than once (at different
  // screenings); keep one link per film, since each film page lists all of
  // its screenings anyway.
  const filmPath = (url: string) => url.replace(/\/[\d-]+\/?$/, '')
  return Array.from(new Map(urls.map((url) => [filmPath(url), url])).values())
}

const extractSubtitles = (html: string) =>
  html.match(
    /course-label">\s*Ondertiteling\s*<\/span>\s*<span class="course-value">([^<]*)</,
  )?.[1]

const hasEnglishSubtitles = (subtitles?: string) =>
  /^(engels|english)$/i.test(subtitles?.trim() ?? '')

const extractTitle = (html: string) => {
  const title = html.match(
    /<li class="breadcrum-item current">([^<]*)<\/li>/,
  )?.[1]
  if (!title) return undefined
  // Drop series prefixes and add-ons, e.g. "Expat Meetup: Coward",
  // "Filmclub Sunset Boelelaan: Palestine 36", "(Un)Doing Justice: Kneecap",
  // "Digger + introduction", "De Manager + nagesprek". Only known series
  // prefixes: real titles can contain a colon too.
  return titleCase(
    decode(title)
      .replace(
        /^(expat meetup|filmclub [^:]+|\(un\)doing justice|voorpremi[eè]re|sneak preview):\s*/i,
        '',
      )
      .replace(/\s+\+\s+.*$/, '')
      .trim(),
  )
}

const extractScreeningUrls = (html: string) =>
  Array.from(html.matchAll(/<option value="(\/film\/[^"]+)"/g), ([, path]) =>
    new URL(path, BASE_URL).toString(),
  )

// e.g. .../film/naza/03-10-2026-19-00
const extractDate = (url: string) => {
  const dateTime = url.match(/(\d{2}-\d{2}-\d{4}-\d{2}-\d{2})\/?$/)?.[1]
  const date = dateTime
    ? DateTime.fromFormat(dateTime, 'dd-MM-yyyy-HH-mm', {
        zone: 'Europe/Amsterdam',
      })
    : undefined
  if (!date?.isValid) {
    throw new Error(`Could not parse Rialto VU screening date from ${url}`)
  }
  return date.toJSDate()
}

const extractFromFilmPage = async (url: string): Promise<Screening[]> => {
  const html = await got(url).text()

  const title = extractTitle(html)
  if (!title) {
    throw new Error(`No title on Rialto VU film page ${url}`)
  }

  const normalize = (u: string) => u.replace(/\/$/, '')
  const screeningUrls = extractScreeningUrls(html)
  if (!screeningUrls.map(normalize).includes(normalize(url))) {
    screeningUrls.push(url)
  }

  const subtitlesPerScreening = await pMap(
    screeningUrls,
    async (screeningUrl) => ({
      screeningUrl,
      subtitles:
        normalize(screeningUrl) === normalize(url)
          ? extractSubtitles(html)
          : extractSubtitles(await got(screeningUrl).text()),
    }),
    { concurrency: 4 },
  )

  logger.debug('film page', { url, title, subtitlesPerScreening })

  return subtitlesPerScreening
    .filter(({ subtitles }) => hasEnglishSubtitles(subtitles))
    .map(({ screeningUrl }) => ({
      title,
      url: screeningUrl,
      cinema: 'Rialto VU',
      date: extractDate(screeningUrl),
    }))
}

const extractFromMainPage = async (): Promise<Screening[]> => {
  const filmUrls = await fetchFilmUrls()
  logger.debug('film urls', { count: filmUrls.length, filmUrls })

  // One film at a time; each film already fetches its screenings in parallel
  const screenings: Screening[] = []
  for (const filmUrl of filmUrls) {
    screenings.push(
      ...(await extractScreeningsFromPages([filmUrl], extractFromFilmPage, {
        logger,
      })),
    )
  }

  return makeScreeningsUniqueAndSorted(screenings)
}

export default extractFromMainPage

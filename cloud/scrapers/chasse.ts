import { DateTime } from 'luxon'
import Xray from 'x-ray'

import { logger as parentLogger } from '../powertools'
import { Screening } from '../types'
import xRayPuppeteer from '../xRayPuppeteer'
import { makeScreeningsUniqueAndSorted } from './utils/makeScreeningsUniqueAndSorted'
import { shortMonthToNumberDutch } from './utils/monthToNumber'
import { splitTime } from './utils/splitTime'
import { titleCase } from './utils/titleCase'
import { normalizeWhitespace, trim } from './utils/xrayFilters'

const logger = parentLogger.createChild({
  persistentLogAttributes: {
    scraper: 'chasse',
  },
})

// chasse.nl is behind Bunny Shield, which answers a plain request (got, curl)
// and headless Chromium with its default 'HeadlessChrome' user agent with a
// 403 "Establishing a secure connection..." JS challenge. Chromium with a
// regular Chrome user agent gets through, hence hideHeadlessUserAgent.
const xray = Xray({ filters: { trim, normalizeWhitespace } })
  .driver(
    xRayPuppeteer({
      logger,
      hideHeadlessUserAgent: true,
      waitForOptions: { timeout: 60_000, waitUntil: 'networkidle2' },
    }),
  )
  .concurrency(1)

const BASE_URL = 'https://www.chasse.nl'

type XRayResult = {
  title: string
  url: string
  date: string
  time: string
}

// 'zo 25 okt 2026', '16.30' => 2026-10-25 16:30 Europe/Amsterdam
export const parseDate = (date: string, time: string) => {
  const [, dayString, monthString, yearString] =
    date.match(/(\d{1,2})\s+([a-z]{3})\s+(\d{4})/i) ?? []
  const timeString = time.match(/\d{1,2}[.:]\d{2}/)?.[0]

  if (!dayString || !timeString) {
    throw new Error(`Could not parse Chasse screening date: ${date} ${time}`)
  }

  const [hour, minute] = splitTime(timeString)

  const parsed = DateTime.fromObject(
    {
      year: Number(yearString),
      month: shortMonthToNumberDutch(monthString),
      day: Number(dayString),
      hour,
      minute,
    },
    { zone: 'Europe/Amsterdam' },
  )

  if (!parsed.isValid) {
    throw new Error(`Could not parse Chasse screening date: ${date} ${time}`)
  }

  return parsed.toJSDate()
}

export const hasEnglishSubtitles = (title: string) => /\(EN subs\)/i.test(title)

// 'A Fantastic Woman (EN subs) | Be Proud Weekend' => 'A Fantastic Woman'
// 'Franz (EN subs) - Internationals Cinema Breda' => 'Franz'
// 'Internationals Cinema (EN subs)' => '' (a placeholder: the film isn't announced yet)
export const cleanTitle = (title: string) => {
  const cleaned = title
    .replace(/\s*\(EN subs\).*$/i, '')
    .replace(/^Internationals Cinema( Breda)?:\s*/i, '')
    .trim()

  return /^Internationals Cinema( Breda)?$/i.test(cleaned)
    ? ''
    : titleCase(cleaned)
}

export const extractScreeningsFromResults = (
  results: XRayResult[],
): Screening[] =>
  results
    .filter(({ title }) => title && hasEnglishSubtitles(title))
    .map((result) => ({ ...result, title: cleanTitle(result.title) }))
    .filter(({ title }) => title)
    .map(({ title, url, date, time }) => ({
      title,
      url: new URL(url, BASE_URL).toString(),
      cinema: 'Chassé Cinema',
      date: parseDate(date, time),
    }))

const extractFromMainPage = async (): Promise<Screening[]> => {
  const results: XRayResult[] = await xray(
    `${BASE_URL}/nl/internationals-cinema-breda-chasse-cinema-breda-13gr`,
    '.eventCard',
    [
      {
        title: 'h3.title | normalizeWhitespace | trim',
        url: 'a.desc@href',
        date: '.top-date .start | normalizeWhitespace | trim',
        time: '.top-date .time | normalizeWhitespace | trim',
      },
    ],
  )

  logger.debug('main page', { results })

  if (results.length === 0) {
    logger.warn('no event cards found, blocked by the bot protection?')
  }

  return makeScreeningsUniqueAndSorted(extractScreeningsFromResults(results))
}

export default extractFromMainPage

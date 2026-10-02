import { DateTime } from 'luxon'

import { fullMonthToNumberDutch } from './monthToNumber'
import { removeYearSuffix } from './removeYearSuffix'
import { splitTime } from './splitTime'
import { titleCase } from './titleCase'

// Parsing helpers for Filmhuis Cavia's month pages (see scrapers/filmhuiscavia.ts)

export const MONTH_PAGE_URL =
  /^https:\/\/filmhuiscavia\.nl\/programma\/(januari|februari|maart|april|mei|juni|juli|augustus|september|oktober|november|december)-(\d{4})\/?$/i

const DATE_TEXT =
  /(?:maandag|dinsdag|woensdag|donderdag|vrijdag|zaterdag|zondag)\s+(\d{1,2})\s+([a-z]+),?\s+(\d{1,2}[:.]\d{2})/i

export const parseMonthPageUrl = (url: string) => {
  const match = url.match(MONTH_PAGE_URL)
  if (!match) return undefined

  return {
    month: fullMonthToNumberDutch(match[1]),
    year: Number(match[2]),
  }
}

// The month page only says "Donderdag 1 oktober"; its URL has the year. An
// entry can also belong to a neighbouring month (a December page listing 2 January).
export const parseDate = (
  text: string,
  page: { month: number; year: number },
) => {
  const match = text.match(DATE_TEXT)
  if (!match) return undefined

  const day = Number(match[1])
  const month = fullMonthToNumberDutch(match[2])
  const [hour, minute] = splitTime(match[3])

  let year = page.year
  if (month - page.month > 6) year -= 1
  if (month - page.month < -6) year += 1

  const date = DateTime.fromObject(
    { year, month, day, hour, minute },
    { zone: 'Europe/Amsterdam' },
  )

  return date.isValid ? date.toJSDate() : undefined
}

// e.g. "Eduardo Coutinho | 1984 | Brazil | 119’ | EN subtitles". Silent films
// and films without dialogue say so there instead, and some entries have no
// such line at all; neither has English subtitles.
export const findMetadataLine = (metadata: string[]) =>
  metadata.find((line) => line.includes('|'))

export const hasEnglishSubtitles = (metadataLine?: string) =>
  /\b(?:EN|English) subtitles\b/i.test(metadataLine ?? '')

export const extractReleaseYear = (metadataLine?: string) => {
  const year = (metadataLine ?? '')
    .split('|')
    .map((field) => field.trim())
    .find((field) => /^(?:19|20)\d{2}$/.test(field))

  return year ? Number(year) : undefined
}

// Drop add-ons to the film title, e.g. "Azart – Come Make Art + Q&A",
// "Ménilmontant with live score by Kadavergraver" and
// "Looking Back – by Porn Film Festival Amsterdam"
export const cleanTitle = (title: string) =>
  titleCase(
    removeYearSuffix(
      title
        .replace(/\s+\+\s+.*$/, '')
        .replace(/\s+with live score\b.*$/i, '')
        .replace(/\s+[–-]\s+by\s+.*$/i, '')
        .replace(/\s+at\s+Nassaukerk$/i, '')
        .trim(),
    ),
  )

// A month page is one article; every screening is an entry separated by
// <hr id="slug">. Returns [{ anchor: 'slug', html: '<entry html>' }, ...]; the
// intro before the first <hr> is skipped, and the last entry runs into the footer.
export const splitEntries = (html: string) => {
  // [intro, <hr>, entry, <hr>, entry, ...]
  const parts = html.split(/(<hr[^>]*>)/i)

  const entries: { anchor?: string; html: string }[] = []
  for (let i = 1; i < parts.length; i += 2) {
    entries.push({
      anchor: parts[i].match(/\sid="([^"]+)"/i)?.[1],
      html: parts[i + 1] ?? '',
    })
  }

  return entries
}

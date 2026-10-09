import { DateTime } from 'luxon'

import { logger as parentLogger } from '../powertools'
import { Screening } from '../types'
import { createXray } from '../xRay'
import { extractScreeningsFromPages } from './utils/extractScreeningsFromPages'
import { makeScreeningsUniqueAndSorted } from './utils/makeScreeningsUniqueAndSorted'
import { monthToNumber } from './utils/monthToNumber'
import { removeYearSuffix } from './utils/removeYearSuffix'
import { splitTime } from './utils/splitTime'
import { titleCase } from './utils/titleCase'

const logger = parentLogger.createChild({
  persistentLogAttributes: {
    scraper: 'filmhuisdespiegel',
  },
})

const xray = createXray({ logger })

// While the Royal Theater in Heerlen is being renovated, Filmhuis De Spiegel
// shows its films in the Kleine Zaal of PLT, Theater Heerlen. The programme and
// the ticket sales moved to PLT's website, so filmhuisdespiegel.nl/programma no
// longer lists any films. PLT's page for the filmhuis has one tile per screening:
//
//   <a class="show-tile" href="https://www.plt.nl/programma/juste-une-illusion/10-10-2026-20-00">
//     <p>Film - Za 10 okt. 2026 - 20:00 uur</p>
//     <div class="h4">Juste une Illusion</div>
//     <div class="h3">Filmhuis de Spiegel</div>
//
// and the screening's own page has the title in its <h1> and a "Credits" block:
//
//   Frankrijk, 2026 | 115 minuten
//   Frans gesproken | Nederlands ondertiteld
const PROGRAMME_URL = 'https://www.plt.nl/filmhuisdespiegel'

type XRayFromProgramme = {
  url: string
  date: string
  organiser: string
}

type XRayFromScreeningPage = {
  title: string
  paragraphs: string[]
}

// "Film - Za 10 okt. 2026 - 20:00 uur"
const DATE_TEXT = /(\d{1,2})\s+([a-z]+)\.?\s+(\d{4})\s*-\s*(\d{1,2}[:.]\d{2})/i

export const parseDate = (text: string) => {
  const match = text.match(DATE_TEXT)
  if (!match) return undefined

  const [, day, month, year, time] = match
  const [hour, minute] = splitTime(time)

  const date = DateTime.fromObject(
    {
      year: Number(year),
      month: monthToNumber(month),
      day: Number(day),
      hour,
      minute,
    },
    { zone: 'Europe/Amsterdam' },
  )

  return date.isValid ? date.toJSDate() : undefined
}

// PLT also lists its own theatre programme; the filmhuis' screenings are the
// ones organised by "Filmhuis de Spiegel" (or "... i.s.m. <partner>")
export const isFilmhuisDeSpiegel = (organiser: string) =>
  /^Filmhuis de Spiegel\b/i.test(organiser)

// The language line reads "Frans gesproken | Nederlands ondertiteld"; some
// films have no subtitles and only say "Nederlands gesproken"
export const findSubtitles = (paragraphs: string[]) =>
  paragraphs
    .flatMap((paragraph) => paragraph.split('|'))
    .map((part) => part.trim())
    .find((part) => /ondertiteld$/i.test(part))

export const hasEnglishSubtitles = (subtitles?: string) =>
  /\b(?:Engels|English)\b/i.test(subtitles ?? '')

// "Frankrijk, 2026 | 115 minuten", directly followed by "Regie: ..." in the
// text of the paragraph
export const extractReleaseYear = (paragraphs: string[]) => {
  const match = paragraphs
    .map((paragraph) =>
      paragraph.match(/(?<!\d)((?:19|20)\d{2})\s*\|\s*\d+\s*minuten/i),
    )
    .find(Boolean)

  return match ? Number(match[1]) : undefined
}

// Drop add-ons and the series a film is shown in, e.g. "No Good Men + Q&A",
// "Cinekid: Extraordinairy" and "Coming Out Day: Jim Queen"
export const cleanTitle = (title: string) =>
  titleCase(
    removeYearSuffix(
      title
        .replace(/\s+\+\s+.*$/, '')
        .replace(/\s+\|\s+AFFR on Tour$/i, '') // 'Construction Site | AFFR on Tour'
        .replace(/^(?:Cinekid|Coming Out Day):\s+/i, '')
        .trim(),
    ),
  )

const extractFromScreeningPage = async ({
  url,
  date,
}: {
  url: string
  date: Date
}): Promise<Screening[]> => {
  const page: XRayFromScreeningPage = await xray(url, {
    title: 'h1 | normalizeWhitespace | trim',
    paragraphs: ['.text-block p | normalizeWhitespace | trim'],
  })

  const paragraphs = page.paragraphs ?? []

  if (!hasEnglishSubtitles(findSubtitles(paragraphs))) return []

  if (!page.title) {
    logger.warn('skipping screening without a title', { url })
    return []
  }

  return [
    {
      title: cleanTitle(page.title),
      year: extractReleaseYear(paragraphs),
      url,
      cinema: 'Filmhuis De Spiegel',
      date,
    },
  ]
}

const extractFromMainPage = async (): Promise<Screening[]> => {
  const tiles: XRayFromProgramme[] = await xray(PROGRAMME_URL, '.show-tile', [
    {
      url: '@href',
      date: '.show-tile__content p | normalizeWhitespace | trim',
      organiser: '.show-tile__content .h3 | normalizeWhitespace | trim',
    },
  ])

  logger.debug('tiles', { tiles })

  const pages = tiles
    .filter(({ organiser }) => isFilmhuisDeSpiegel(organiser ?? ''))
    .flatMap(({ url, date }) => {
      const parsedDate = parseDate(date ?? '')

      if (!url || !parsedDate) {
        logger.warn('skipping screening with an unknown date', { url, date })
        return []
      }

      return [{ url, date: parsedDate }]
    })

  if (pages.length === 0) {
    logger.warn('no Filmhuis De Spiegel screenings found on the PLT programme')
  }

  const screenings = await extractScreeningsFromPages(
    pages,
    extractFromScreeningPage,
    { logger, url: ({ url }) => url },
  )

  logger.debug('screenings', { screenings })

  return makeScreeningsUniqueAndSorted(screenings)
}

export default extractFromMainPage

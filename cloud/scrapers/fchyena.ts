import got from 'got'
import { DateTime } from 'luxon'

import { logger as parentLogger } from '../powertools'
import { Screening } from '../types'
import { createXray } from '../xRay'
import { extractScreeningsFromPages } from './utils/extractScreeningsFromPages'
import { makeScreeningsUniqueAndSorted } from './utils/makeScreeningsUniqueAndSorted'
import { removeYearSuffix } from './utils/removeYearSuffix'
import { titleCase } from './utils/titleCase'

const logger = parentLogger.createChild({
  persistentLogAttributes: {
    scraper: 'fchyena',
  },
})

const xray = createXray({ logger })

// FC Hyena's site is built with Framer, but server rendered:
//
// - /calendar links every film to its ticket shop with
//   `.../z_events_list?production_id=123488`
// - /films/<production id> is the page of a film, with its title and a list of
//   details (director, genre, country, language, year). The language says
//   whether there are English subtitles, e.g. 'Hebrew, with English subs',
//   but also 'Engels gesproken, Nederlands ondertiteld'
// - the ticket shop lists all dates of a film, so not only this week's
const BASE_URL = 'https://fchyena.nl'
const TICKETS_URL =
  'https://tickets.fchyena.nl/fchyena/nl/flow_configs/1/z_events_list'

type DetailPageResult = {
  title: string
  language?: string
  year?: string
}

type TicketPageResult = {
  date: string
}

export const parseProductionId = (href: string) => {
  const productionId = href.match(/[?&]production_id=(\d+)(?:&|$)/)?.[1]

  return productionId && productionId !== '0' ? productionId : undefined
}

// e.g. 'Hebrew, with English subs'. Not 'Engels gesproken, Nederlands
// ondertiteld', 'Engels gesproken, geen ondertiteling' or a bare 'Engels'
export const hasEnglishSubtitles = (language?: string) =>
  /\b(?:english|engels|eng)\s+(?:subs|subtitles|ondertiteld|ondertiteling)\b/i.test(
    language ?? '',
  )

// 'NAZA - ENG SUBS' and 'NAZA - NL subs' are the same film with different subtitles
export const cleanTitle = (title: string) =>
  titleCase(
    removeYearSuffix(
      title.replace(/\s+-\s+(?:eng|english|nl)\s+subs$/i, '').trim(),
    ),
  )

export const parseReleaseYear = (year?: string) => {
  const match = (year ?? '').trim().match(/^(?:19|20)\d{2}$/)

  return match ? Number(match[0]) : undefined
}

// e.g. 'za 03 oktober 2026, 12:20'
export const parseScreeningDate = (date: string) => {
  const parsed = DateTime.fromFormat(date, 'ccc d LLLL yyyy, HH:mm', {
    locale: 'nl',
    zone: 'Europe/Amsterdam',
  })

  if (!parsed.isValid) {
    throw new Error(`Could not parse FC Hyena screening date: ${date}`)
  }

  return parsed.toJSDate()
}

const extractFromTicketPage = async (
  productionId: string,
): Promise<TicketPageResult[]> => {
  const html = await got(TICKETS_URL, {
    searchParams: { production_id: productionId },
  }).text()

  return xray(html, 'table tbody tr', [
    {
      date: 'p | normalizeWhitespace | trim',
    },
  ])
}

const extractFromMoviePage = async (
  productionId: string,
): Promise<Screening[]> => {
  const url = `${BASE_URL}/films/${productionId}`

  // Every detail is a label and a value in two containers next to each other
  const movie: DetailPageResult = await xray(url, {
    title: 'h2 | normalizeWhitespace | trim',
    language:
      '[data-framer-name="Langauge"] > div:last-child p | normalizeWhitespace | trim', // sic
    year: '[data-framer-name="Year"] > div:last-child p | normalizeWhitespace | trim',
  })

  logger.debug('movie page', { url, movie })

  // The title can say it as well: 'NAZA - ENG SUBS'
  if (
    !movie.title ||
    !hasEnglishSubtitles(`${movie.language ?? ''} ${movie.title}`)
  ) {
    return []
  }

  const screenings = await extractFromTicketPage(productionId)

  logger.debug('ticket page', { productionId, screenings })

  return screenings.map(({ date }) => ({
    title: cleanTitle(movie.title),
    year: parseReleaseYear(movie.year),
    url,
    cinema: 'FC Hyena',
    date: parseScreeningDate(date),
  }))
}

const extractFromMainPage = async (): Promise<Screening[]> => {
  const links: string[] = await xray(`${BASE_URL}/calendar`, [
    'a[href*="production_id="]@href',
  ])

  const productionIds = Array.from(
    new Set(links.map(parseProductionId).filter((id): id is string => !!id)),
  )

  logger.debug('main page', { productionIds })

  if (productionIds.length === 0) {
    logger.warn('no films found on the calendar')
  }

  const screenings = await extractScreeningsFromPages(
    productionIds,
    extractFromMoviePage,
    { logger, url: (productionId) => `${BASE_URL}/films/${productionId}` },
  )

  return makeScreeningsUniqueAndSorted(screenings)
}

export default extractFromMainPage

import { DateTime } from 'luxon'

import { logger as parentLogger } from '../powertools'
import { Screening } from '../types'
import { extractYearFromTitle } from './utils/extractYearFromTitle'
import { makeScreeningsUniqueAndSorted } from './utils/makeScreeningsUniqueAndSorted'
import { removeYearSuffix } from './utils/removeYearSuffix'
import { runIfMain } from './utils/runIfMain'
import { titleCase } from './utils/titleCase'
import { createXray } from '../xRay'

const logger = parentLogger.createChild({
  persistentLogAttributes: {
    scraper: 'desien',
  },
})

const xray = createXray({ logger })

type XRayResult = {
  url: string
  title: string
  date: string
  time: string
  location: string
  tags: string
}

const parseScreeningDate = (date: string, time: string) => {
  const parsed = DateTime.fromFormat(`${date} ${time}`, 'yyyyMMdd HH:mm', {
    zone: 'Europe/Amsterdam',
  })

  if (!parsed.isValid) {
    throw new Error(`Could not parse De Sien screening date: ${date} ${time}`)
  }

  return parsed.toJSDate()
}

const ENGLISH_SUBS_TITLE_SUFFIX = /\s*\|\s*eng(lish)? subs$/i

// De Sien prefixes titles with a series or partner, e.g. "UQCF | Rebel Dykes"
// or "Centraal Museum | News From Home (1977)"; keep only the film title.
const cleanTitle = (title: string) =>
  titleCase(
    removeYearSuffix(
      title.replace(ENGLISH_SUBS_TITLE_SUFFIX, '').split(' | ').pop() ?? title,
    ),
  )

// Film page slugs sometimes end in the release year, e.g. /uqcf-rebel-dykes-2021/
const extractYearFromUrl = (url: string) => {
  const year = url.match(/-((?:19|20)\d{2})\/?$/)?.[1]
  return year ? Number(year) : undefined
}

// De Sien marks English-subtitled screenings with the "English No Problem"
// selection and/or an "| Eng subs" title suffix. The data-genre "englishsubs"
// marker it used before is kept as a fallback.
const hasEnglishSubtitles = ({ title, tags, location }: XRayResult) =>
  Boolean(
    tags?.toLowerCase().includes('englishsubs') ||
    location?.toLowerCase().includes('english no problem') ||
    ENGLISH_SUBS_TITLE_SUFFIX.test(title ?? ''),
  )

const extractFromMainPage = async (): Promise<Screening[]> => {
  const results: XRayResult[] = await xray(
    'https://desienfilm.nl/films?filter=englishsubs&datum=alle-tijden',
    'a.item.element',
    [
      {
        url: '@href',
        title: 'h2 | normalizeWhitespace | trim',
        date: '@data-date',
        time: '.cont .date | normalizeWhitespace | trim',
        location: '.special | normalizeWhitespace | trim',
        tags: '@data-genre',
      },
    ],
  )

  logger.debug('main page', { results })

  const screenings = results
    .filter(hasEnglishSubtitles)
    .map(({ title, url, date, time }) => ({
      title: cleanTitle(title),
      year: extractYearFromTitle(title) ?? extractYearFromUrl(url),
      url,
      cinema: 'De Sien',
      date: parseScreeningDate(date, time),
    }))

  return makeScreeningsUniqueAndSorted(screenings)
}

runIfMain(extractFromMainPage, import.meta.url)

export default extractFromMainPage

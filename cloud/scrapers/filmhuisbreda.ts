import { DateTime } from 'luxon'
import Xray from 'x-ray'

import { logger as parentLogger } from '../powertools'
import { Screening } from '../types'
import { makeScreeningsUniqueAndSorted } from './utils/makeScreeningsUniqueAndSorted'
import { runIfMain } from './utils/runIfMain'
import { titleCase } from './utils/titleCase'
import { trim } from './utils/xrayFilters'

const logger = parentLogger.createChild({
  persistentLogAttributes: {
    scraper: 'filmhuisbreda',
  },
})

const xray = Xray({
  filters: {
    trim,
    normalizeWhitespace: (value: unknown) =>
      typeof value === 'string' ? value.replace(/\s+/g, ' ') : value,
  },
})
  .concurrency(10)
  .throttle(10, 300)

const hasEnglishSubtitles = (bodyText: string) =>
  /ondertitelde taal\s+engels/i.test(bodyText)

type XRayFilmPage = {
  bodyText: string
  title: string
  timestamps: string[]
}

const extractFromFilmPage = async (url: string): Promise<Screening[]> => {
  let page: XRayFilmPage
  try {
    page = await xray(url, {
      bodyText: 'body@text | normalizeWhitespace | trim',
      title: 'h1 | trim',
      timestamps: ['[data-timestamp]@data-timestamp'],
    })
  } catch (error) {
    logger.warn('skipping film page that could not be fetched', { url, error })
    return []
  }

  if (!hasEnglishSubtitles(page.bodyText)) {
    return []
  }

  const title = page.title ? titleCase(page.title) : null
  if (!title) {
    logger.warn('skipping film page with missing title', { url })
    return []
  }

  const dates = page.timestamps
    .filter(Boolean)
    .map((ts) =>
      DateTime.fromSeconds(Number(ts), { zone: 'Europe/Amsterdam' }).toJSDate(),
    )

  if (dates.length === 0) {
    logger.warn('skipping film page with no screening times', { url })
    return []
  }

  return dates.map((date) => ({
    title,
    url,
    cinema: 'Filmhuis Botanique Breda',
    date,
  }))
}

const extractFromMainPage = async (): Promise<Screening[]> => {
  const allLinks: string[] = await xray(
    'https://www.filmhuisbreda.nl/film-overzicht/alle-films',
    'a',
    ['@href'],
  )

  // Deduplicate by film ID (same film appears with different hall IDs, same film
  // appears for different cinemas like hall 17 and 202)
  const uniqueUrls = Array.from(
    new Map(
      allLinks
        .filter(Boolean)
        .map((href) => {
          const match = href.match(/\/movies\/(\d+)\//)
          return match ? ([match[1], href] as const) : null
        })
        .filter((x): x is [string, string] => x !== null),
    ).values(),
  )

  logger.info('film urls', { numberOfUrls: uniqueUrls.length })

  const screenings = (
    await Promise.all(uniqueUrls.map(extractFromFilmPage))
  ).flat()

  return makeScreeningsUniqueAndSorted(screenings)
}

runIfMain(extractFromMainPage, import.meta.url)

export default extractFromMainPage

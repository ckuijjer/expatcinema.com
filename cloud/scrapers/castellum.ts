import { DateTime } from 'luxon'
import Xray from 'x-ray'

import { logger as parentLogger } from '../powertools'
import { Screening } from '../types'
import { makeScreeningsUniqueAndSorted } from './utils/makeScreeningsUniqueAndSorted'
import { runIfMain } from './utils/runIfMain'
import { titleCase } from './utils/titleCase'
import { normalizeWhitespace, trim } from './utils/xrayFilters'

const logger = parentLogger.createChild({
  persistentLogAttributes: {
    scraper: 'castellum',
  },
})

const xray = Xray({
  filters: {
    trim,
    normalizeWhitespace,
  },
})
  .concurrency(10)
  .throttle(10, 300)

const hasEnglishSubtitles = (bodyText: string) =>
  /Ondertiteling: Engels|Engelse ondertiteling/i.test(bodyText)

type XRayFilmPage = {
  bodyText: string
  title: string
  jsonLd: string[]
}

const extractFromFilmPage = async (url: string): Promise<Screening[]> => {
  let page: XRayFilmPage
  try {
    page = await xray(url, {
      bodyText: 'body@text | normalizeWhitespace | trim',
      title: 'h1 span | trim',
      jsonLd: ['script[type="application/ld+json"]'],
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

  const dates = page.jsonLd.flatMap((json) => {
    try {
      const data: unknown = JSON.parse(json)
      const top = typeof data === 'object' && data !== null ? data : {}
      const items: unknown[] =
        '@graph' in top
          ? (top as { '@graph': unknown[] })['@graph']
          : Array.isArray(data)
            ? data
            : [data]
      return items
        .filter(
          (item): item is { startDate: string } =>
            typeof item === 'object' && item !== null && 'startDate' in item,
        )
        .map((item) =>
          DateTime.fromISO(item.startDate, { zone: 'Europe/Amsterdam' }).toJSDate(),
        )
    } catch {
      return []
    }
  })

  if (dates.length === 0) {
    logger.warn('skipping film page with no screening dates', { url })
    return []
  }

  return dates.map((date) => ({
    title,
    url,
    cinema: 'Castellum Theater & Film',
    date,
  }))
}

const extractFromMainPage = async (): Promise<Screening[]> => {
  const allLinks: string[] = await xray('https://castellum.nl/film', 'a', [
    '@href',
  ])

  // Keep unique film detail URLs only (exclude /bestel/ ticket links and other pages)
  const filmUrls = Array.from(
    new Set(
      allLinks.filter(Boolean).filter((href) => {
        try {
          const url = new URL(href)
          const parts = url.pathname.split('/').filter(Boolean)
          return (
            url.hostname === 'castellum.nl' &&
            parts[0] === 'film' &&
            parts.length === 2
          )
        } catch {
          return false
        }
      }),
    ),
  )

  logger.info('film urls', { numberOfUrls: filmUrls.length })

  const screenings = (
    await Promise.all(filmUrls.map(extractFromFilmPage))
  ).flat()

  return makeScreeningsUniqueAndSorted(screenings)
}

runIfMain(extractFromMainPage, import.meta.url)

export default extractFromMainPage

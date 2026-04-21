import { DateTime } from 'luxon'
import pRetry from 'p-retry'
import Xray from 'x-ray'

import { logger as parentLogger } from '../powertools'
import { Screening } from '../types'
import xRayPuppeteer from '../xRayPuppeteer'
import {
  fullMonthToNumberDutch,
  shortMonthToNumberDutch,
} from './utils/monthToNumber'
import { runIfMain } from './utils/runIfMain'
import { splitTime } from './utils/splitTime'
import { titleCase } from './utils/titleCase'
import { uniq } from './utils/uniq'
import { trim } from './utils/xrayFilters'

const logger = parentLogger.createChild({
  persistentLogAttributes: {
    scraper: 'ketelhuis',
  },
})

const xray = Xray({
  filters: {
    trim,
    cleanTitle: (value: unknown) =>
      typeof value === 'string'
        ? titleCase(
            value
              .replace(/ – English subtitles$/i, '')
              .replace(/ \(English subs\)$/i, ''),
          )
        : value,
    normalizeWhitespace: (value: unknown) =>
      typeof value === 'string' ? value.replace(/\s+/g, ' ') : value,
  },
})
  .driver(xRayPuppeteer({ logger, waitForOptions: { timeout: 40_000 } }))
  .concurrency(3)
  .throttle(3, 600)
  .timeout('45s')

type KetelhuisListing = {
  url: string
  title: string
}

type KetelhuisMoviePage = {
  title: string
  metadata: string
  mainContent: string
  firstDate: string
  firstTimes: string[]
  other: {
    date: string
    times: string[]
  }[]
}

const extractFromMainPage = async () => {
  const selector = [
    {
      url: '@data-href',
      title: '.header_title h2 | cleanTitle | trim',
    },
  ]

  const expatCinemaResults = await pRetry<KetelhuisListing[]>(
    async () =>
      xray(
        'https://www.ketelhuis.nl/specials/expat-cinema/',
        '.c-movie-listing__item[data-href^="https://www.ketelhuis.nl/films/"]',
        selector,
      ),
    {
      onFailedAttempt: ({ attemptNumber, retriesLeft }) => {
        logger.warn(
          `Scraping https://www.ketelhuis.nl/specials/expat-cinema/, attempt ${attemptNumber} failed. There are ${retriesLeft} retries left.`,
        )
      },
      retries: 5,
    },
  )
  logger.info('scraped /expat-cinema', { expatCinemaResults })

  const results = [...expatCinemaResults]
  const uniqueResults = uniq(results)

  logger.info('results', { results })
  logger.info('uniqueResults', { uniqueResults })

  const screenings = await (
    await Promise.all(
      uniqueResults.map(async ({ url, title }: KetelhuisListing, i) => {
        return pRetry(
          async () => {
            const result = await extractFromMoviePage({ url, title })
            return result
          },
          {
            onFailedAttempt: ({ attemptNumber, retriesLeft }) => {
              logger.warn(
                `Scraping ${i} ${url}, attempt ${attemptNumber} failed. There are ${retriesLeft} retries left.`,
              )
            },
            retries: 5,
          },
        )
      }),
    )
  ).flat()

  return screenings
}

const hasEnglishSubtitles = ({
  metadata,
  mainContent,
  title,
}: {
  metadata?: string
  mainContent?: string
  title?: string
}) =>
  title?.toLowerCase().includes('english subs') ||
  metadata?.toLowerCase().includes('english subtitles') ||
  metadata?.toLowerCase().includes('engels ondertiteld') ||
  mainContent?.toLowerCase().includes('engels ondertiteld')

const extractReleaseYear = (metadata: string) => {
  const match = metadata.match(/(?:^|\s)Jaar\s*(?:19|20)\d{2}\b/i)
  const year = match?.[0].match(/\b((?:19|20)\d{2})\b/)

  return year?.[1] ? Number(year[1]) : undefined
}

const splitFirstDate = (date: string) => {
  if (date === 'Vandaag') {
    const { day, month, year } = DateTime.now()
    return { day, month, year }
  } else {
    const [dayOfWeek, dayString, monthString, yearString] = date.split(' ')

    const day = Number(dayString)
    const month = fullMonthToNumberDutch(monthString)
    const year = Number(yearString)

    return { day, month, year }
  }
}

const toDateOrThrow = (date: DateTime, url: string) => {
  const parsed = date.toJSDate()
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Could not format screening date for ${url}`)
  }

  return parsed
}

const extractFromMoviePage = async ({
  url,
  title,
}: KetelhuisListing): Promise<Screening[]> => {
  logger.info('extracting', { url })

  const scrapeResult = (await xray(url, {
    title: '.c-filmheader__content h1 > span', // not using cleanTitle because we want to keep the "English subs" part here
    metadata: '.c-detail-info__filminfo | normalizeWhitespace',
    mainContent: '.c-main-content | normalizeWhitespace',
    firstDate: '.c-detail-schedule__firstday div:first-of-type | trim',
    firstTimes: ['.c-detail-schedule__times a | normalizeWhitespace | trim'],
    other: xray('.c-detail-schedule-complete__wrapper li', [
      {
        date: '.c-detail-schedule-complete__date',
        times: ['.c-detail-schedule-complete__time'],
      },
    ]),
  })) as KetelhuisMoviePage

  logger.info('extracted', { url, scrapeResult })

  if (!hasEnglishSubtitles(scrapeResult)) {
    logger.info('hasEnglishSubtitles false', { url })

    return []
  }

  const firstDates = scrapeResult.firstTimes.map((time: string) => {
    const { day, month, year } = splitFirstDate(scrapeResult.firstDate)

    const [hour, minute] = splitTime(time)

    return toDateOrThrow(
      DateTime.fromObject({
        day,
        month,
        hour,
        minute,
        year,
      }),
      url,
    )
  })

  const otherDates = scrapeResult.other.flatMap(
    ({ date, times }: KetelhuisMoviePage['other'][number]) => {
      const [dayString, monthString, yearString] = date.split(' ')
      const day = Number(dayString)
      const month = shortMonthToNumberDutch(monthString)
      const year = Number(yearString)

      return times.map((time: string) => {
        const [hour, minute] = splitTime(time)

        return toDateOrThrow(
          DateTime.fromObject({
            day,
            month,
            hour,
            minute,
            year,
          }),
          url,
        )
      })
    },
  )

  const releaseYear = extractReleaseYear(scrapeResult.metadata ?? '')

  const screenings = [...firstDates, ...otherDates].map((date) => ({
    date,
    url,
    cinema: 'Ketelhuis',
    title,
    year: releaseYear,
  }))

  logger.info('screenings', { screenings })
  return screenings
}

runIfMain(extractFromMainPage, import.meta.url)

export default extractFromMainPage

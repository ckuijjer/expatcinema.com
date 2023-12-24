import Xray from 'x-ray'
import { DateTime } from 'luxon'
import * as R from 'ramda'
import {
  shortMonthToNumberDutch,
  fullMonthToNumberDutch,
} from './utils/monthToNumber'
import splitTime from './utils/splitTime'
import xRayPuppeteer from '../xRayPuppeteer'

import { logger as parentLogger } from '../powertools'

const logger = parentLogger.createChild({
  persistentLogAttributes: {
    scraper: 'ketelhuis',
  },
})

const xray = Xray({
  filters: {
    trim: (value) => (typeof value === 'string' ? value.trim() : value),
    cleanTitle: (value) =>
      typeof value === 'string'
        ? value.replace(/ – English subtitles$/, '')
        : value,
    normalizeWhitespace: (value) =>
      typeof value === 'string' ? value.replace(/\s+/g, ' ') : value,
  },
})
  .driver(xRayPuppeteer({ logger, waitForOptions: { timeout: 60000 } }))
  .concurrency(2)
  .throttle(10, 300)

const extractFromMainPage = async () => {
  const selector = [
    {
      url: '@href',
      title: '',
    },
  ]

  const expatCinemaResults = await xray(
    'https://www.ketelhuis.nl/specials/expat-cinema/',
    '.c-default-page-content a[href^="https://www.ketelhuis.nl/films/"]',
    selector,
  )
  logger.info('scraped /expat-cinema', { expatCinemaResults })

  const deutschesKinoResults = await xray(
    'https://www.ketelhuis.nl/specials/deutsches-kino/',
    '.c-default-page-content a[href^="https://www.ketelhuis.nl/films/"]',
    selector,
  )
  logger.info('scraped /deutsches-kino', { deutschesKinoResults })

  const italianCineclubResults = await xray(
    'https://www.ketelhuis.nl/specials/italian-cineclub/',
    '.c-default-page-content a[href^="https://www.ketelhuis.nl/films/"]',
    selector,
  )
  logger.info('scraped /italian-cineclub', { italianCineclubResults })

  const results = [
    ...expatCinemaResults,
    ...deutschesKinoResults,
    ...italianCineclubResults,
  ]
  const uniqueResults = R.uniq(results)

  logger.info('results', { results })
  logger.info('uniqueResults', { uniqueResults })

  const extracted = await (
    await Promise.all(uniqueResults.map(extractFromMoviePage))
  ).flat()

  return extracted
}

const hasEnglishSubtitles = ({ metadata, mainContent, title }) =>
  title?.toLowerCase().includes('english subs') ||
  metadata?.toLowerCase().includes('english subtitles') ||
  metadata?.toLowerCase().includes('engels ondertiteld') ||
  mainContent?.toLowerCase().includes('engels ondertiteld')

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

const extractFromMoviePage = async ({ url, title }) => {
  logger.info('extracting', { url })

  const scrapeResult = await xray(url, {
    title: '.c-filmheader__content h1 > span | cleanTitle | trim',
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
  })

  logger.info('extracted', { url, scrapeResult })

  if (!hasEnglishSubtitles(scrapeResult)) {
    logger.info('hasEnglishSubtitles false', { url })

    return []
  }

  const firstDates = scrapeResult.firstTimes.map((time) => {
    const { day, month, year } = splitFirstDate(scrapeResult.firstDate)

    const [hour, minute] = splitTime(time)

    return DateTime.fromObject({
      day,
      month,
      hour,
      minute,
      year,
    })
      .toUTC()
      .toISO()
  })

  const otherDates = scrapeResult.other.flatMap(({ date, times }) => {
    const [dayString, monthString, yearString] = date.split(' ')
    const day = Number(dayString)
    const month = shortMonthToNumberDutch(monthString)
    const year = Number(yearString)

    return times.map((time) => {
      const [hour, minute] = splitTime(time)

      return DateTime.fromObject({
        day,
        month,
        hour,
        minute,
        year,
      })
        .toUTC()
        .toISO()
    })
  })

  const screenings = [...firstDates, ...otherDates].map((date) => ({
    date,
    url,
    cinema: 'Ketelhuis',
    title,
  }))

  logger.info('screenings', { screenings })
  return screenings
}

if (require.main === module) {
  extractFromMainPage()
    .then((x) => JSON.stringify(x, null, 2))
    .then(console.log)
  // extractFromMoviePage({
  //   url: 'https://www.ketelhuis.nl/films/toen-we-van-de-duitsers-verloren/',
  // })
  //   .then((x) => JSON.stringify(x, null, 2))
  //   .then(console.log)
}

export default extractFromMainPage

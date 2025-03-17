import { DateTime } from 'luxon'
import Xray from 'x-ray'

import { logger as parentLogger } from '../powertools'
import { Screening } from '../types'
import { guessYear } from './utils/guessYear'
import { monthToNumber } from './utils/monthToNumber'
import { splitTime } from './utils/splitTime'
import { titleCase } from './utils/titleCase'

const logger = parentLogger.createChild({
  persistentLogAttributes: {
    scraper: 'concordia',
  },
})

type XRayFromMainPage = {
  url: string
  title: string
}

const xray = Xray({
  filters: {
    trim: (value) => (typeof value === 'string' ? value.trim() : value),
  },
})
  .concurrency(10)
  .throttle(10, 300)

// dinsdag 24 sep.
// maandag 14 okt.
const parseDate = (date: string) => {
  if (date === 'Vandaag') {
    const { day, month, year } = DateTime.now()
    return { day, month, year }
  } else if (date === 'Morgen') {
    const { day, month, year } = DateTime.now().plus({ days: 1 })
    return { day, month, year }
  } else if (/^[0-9]{2}-[0-9]{2}-[0-9]{4}$/.test(date)) {
    // 10-10-2024
    // 30-09-2024
    const [dayString, monthString, yearString] = date.split('-')
    const day = Number(dayString)
    const month = Number(monthString)
    const year = Number(yearString)

    return { day, month, year }
  } else {
    // b.v. ma 11.12
    const [dayOfWeek, dayString, monthString] = date.split(/ |\./) // space or dot

    const day = Number(dayString)
    const month = monthToNumber(monthString)
    const year = guessYear({ day, month })

    return { day, month, year }
  }
}

const hasEnglishSubtitles = (metadata) => metadata.Ondertiteling === 'ENG'

const extractFromMoviePage = async (url: string): Promise<Screening[]> => {
  logger.info('extracting movie page', { url })

  const xrayResult = await xray(url, {
    title: 'section .col-span-full .offer-detail-header-caption h1',
    screenings: xray(
      'section .col-span-full .relative.py-6 > .grid > div > div, .relative.py-6',
      [
        {
          date: 'span.p--small:not(:has(button)) | trim',
          times: ['> div > a > span:first-child | trim'],
        },
      ],
    ),
    sidebarButton: 'button.link[data-target="offerTimes"]',
    sidebarScreenings: xray('[data-id="offerTimes"] > div > div > div', [
      {
        date: 'span.p--small:not(:has(button)) | trim',
        times: ['a > span:first-child | trim'],
      },
    ]),
    metadata: xray('section .col-span-full .hidden .grid .flex', [
      {
        key: 'span | trim',
        value: '@text | trim', // contains both the key and the value, @text:not(:has(span)) or @text:not(span) doesn't work
      },
    ]),
  })

  if (
    xrayResult.screenings.length === 0 ||
    xrayResult.sidebarScreenings.length === 0 ||
    xrayResult.metadata.length === 0
  ) {
    logger.error('No movies found on movie page, scraper is probably broken', {
      url,
      xrayResult,
    })
  }

  //   fix metadata by taking of the key from the value
  const metadata = xrayResult.metadata.reduce((acc, { key, value }) => {
    acc[key] = value
      .replace(key, '') // remove the key from the value
      .replace(/\n/g, '') // remove all newlines
      .replace(/\s{2,}/g, ' ') // convert all double spaces (or more) to single space
      .trim()
    return acc
  }, {})

  if (!hasEnglishSubtitles(metadata)) return []

  // For some pages with English subtitled screenings, the sidebar is hidden and not accessible (it contains the regular non English subtitled screenings)
  const scrapedScreenings = xrayResult.sidebarButton
    ? xrayResult.sidebarScreenings
    : xrayResult.screenings

  const screenings = scrapedScreenings
    .filter(({ date, times }) => {
      return date && times.length > 0 // remove the movies that don't have a screening time (yet)
    })
    .flatMap(({ date, times }) => {
      return times.map((time) => {
        const { day, month, year } = parseDate(date)
        const [hour, minute] = splitTime(time)

        return {
          title: titleCase(xrayResult.title),
          url,
          date: DateTime.fromObject({
            day,
            month,
            year,
            hour,
            minute,
          }).toJSDate(),
          cinema: 'Concordia',
        }
      })
    })

  return screenings
}

const extractFromMainPage = async (): Promise<Screening[]> => {
  logger.info('extracting main page')

  const xrayResult: XRayFromMainPage[] = await xray(
    'https://www.concordia.nl/film',
    '#offerList div div',
    [
      {
        url: 'div div a@href',
        title: 'a h4 | trim',
      },
    ],
  )

  const uniqueUrls = Array.from(
    new Set(
      xrayResult
        .map((x) => x.url)
        .filter(
          (url) => url !== undefined && url !== 'https://www.concordia.nl/film',
        ),
    ),
  )

  logger.info('main page', { uniqueUrls })

  if (uniqueUrls.length === 0) {
    logger.error('No movies found on main page, scraper is probably broken')
    return []
  }

  const screenings = await Promise.all(uniqueUrls.map(extractFromMoviePage))

  logger.info('before flatten', { screenings })

  return screenings.flat()
}

if (
  (typeof module === 'undefined' || module.exports === undefined) && // running in ESM
  import.meta.url === new URL(import.meta.url).href // running as main module, not importing from another module
) {
  // extractFromMoviePage(
  //   'https://www.concordia.nl/film/the-substance',
  //   // 'https://www.concordia.nl/film/een-schitterend-gebrek',
  //   // 'https://www.concordia.nl/film/a-new-kind-of-wilderness',
  //   // 'https://www.concordia.nl/film/the-gullspang-miracle/the-gullspang-miracle',
  //   // 'https://www.concordia.nl/film/how-to-make-millions-before-grandma-dies/how-to-make-millions-before-grandma-dies',
  //   // 'https://www.concordia.nl/film/heaven-stood-still-the-incarnations-of-willy-deville',
  // )
  //   .then((x) => JSON.stringify(x, null, 2))
  //   .then(console.log)

  extractFromMainPage()
    .then((x) => JSON.stringify(x, null, 2))
    .then(console.log)
}

export default extractFromMainPage

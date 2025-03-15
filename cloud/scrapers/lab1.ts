import { DateTime } from 'luxon'
import Xray from 'x-ray'

import { logger as parentLogger } from '../powertools'
import { Screening } from '../types'
import { titleCase } from './utils/titleCase'

const logger = parentLogger.createChild({
  persistentLogAttributes: {
    scraper: 'lab1',
  },
})

const xray = Xray({
  filters: {
    trim: (value) => (typeof value === 'string' ? value.trim() : value),
    cleanTitle: (value) =>
      typeof value === 'string' ? value.replace(/\(.*\)\s+$/, '') : value,
    normalizeWhitespace: (value) =>
      typeof value === 'string' ? value.replace(/\s+/g, ' ') : value,
  },
})
  .concurrency(10)
  .throttle(10, 300)

type XRayFromMainPage = {
  title: string
  url: string
}

type XRayFromMoviePage = {
  date: string
  subtitles: string
}

type ScreeningEvent = {
  '@context': 'http://schema.org'
  '@type': 'ScreeningEvent'
  name: string
  url: string
  image: string
  startDate: string
  endDate: string
  description: string
  location: {
    '@type': 'MovieTheater'
    name: string
    image: string
    url: string
    priceRange: string
    openingHours: string[]
    address: string
    telephone: string
  }
  performer: string
  workPresented: {
    '@type': 'Movie'
    name: string
    image: string
    dateCreated: string
    director: string
    description: string
    url: string
    offers: {
      '@type': 'Offer'
      url: string
      price: number
      priceCurrency: string
      category: string
      availability: string
      validFrom: string
    }
  }
  videoFormat: string
  offers: {
    '@type': 'Offer'
    url: string
    price: number
    priceCurrency: string
    category: string
    availability: string
    validFrom: string
  }
  eventAttendanceMode: string
  eventStatus: string
  organizer: {
    name: string
    '@type': 'Thing'
    url: string
  }
}

const cleanTitle = (title: string) =>
  titleCase(
    title // e.g. Nordic Watching: Unruly (English subtitled)
      .replace(/\s+\(.*?\)$/i, '') // e.g. (English subtitled)
      .replace(/^.*?:\s+/, ''), // e.g. Nordic Watching:
  )

// const hasEnglishSubtitles = (title: string) =>
//   title.toLowerCase().includes('english subtitled')

const hasEnglishSubtitles = (subtitles: string) => {
  return /ENG\s+SUBS/i.test(subtitles) // \s+ to catch whatever the &nbsp; in ENG&nbsp;SUBS becomes
}

// Time in Amsterdam time, this is a bit of a hack to get the time in UTC
const extractDate = (time: string) =>
  DateTime.fromISO(time, { zone: 'utc' })
    .setZone('Europe/Amsterdam', { keepLocalTime: true })
    .toJSDate()

const extractFromMoviePage = async ({
  url,
  title,
}: {
  url: string
  title: string
}) => {
  logger.info('movie page', { url })

  // #content so we get the 2nd JSON-LD script tag
  // const scrapeResult: XRayFromMoviePage = await xray(url, '#content', {
  //   jsonLd: 'script[type="application/ld+json"]',
  // })
  // const screeningEvents: ScreeningEvent[] = JSON.parse(scrapeResult.jsonLd)

  const scrapeResult: XRayFromMoviePage[] = await xray(url, '.shows a', [
    {
      date: 'time@datetime | trim',
      subtitles: '.subtitles | trim',
    },
  ])

  logger.info('scrape result', { scrapeResult })

  const screenings: Screening[] = scrapeResult
    .filter(({ subtitles }) => hasEnglishSubtitles(subtitles))
    .map(({ date }) => {
      return {
        title: cleanTitle(title),
        url: url,
        cinema: 'Lab-1',
        date: extractDate(date),
      }
    })

  logger.info('screenings', { screenings })
  return screenings
}

const extractFromMainPage = async () => {
  try {
    logger.info('main page')

    const scrapeResult: XRayFromMainPage[] = await xray(
      'https://www.lab-1.nl/expats/',
      '#content .zmoviecontainer', // for each movie there is a .zmoviecontainer
      [
        {
          title: 'h3 | trim',
          url: 'h3 a@href | trim',
        },
      ],
    )

    logger.info('scrape result', { scrapeResult })

    const screenings: Screening[] = (
      await Promise.all(scrapeResult.map(extractFromMoviePage))
    ).flat()

    logger.info('screenings found', { screenings })

    return screenings
  } catch (error) {
    logger.error('error scraping lab1', { error })
    return []
  }
}

if (import.meta.url === new URL(import.meta.url).href) {
  extractFromMainPage()
    .then((x) => JSON.stringify(x, null, 2))
    .then(console.log)

  // extractFromMoviePage({
  //   url: 'https://www.lab-1.nl/film/evil-does-not-exist/',
  //   title: 'Evil Does Not Exist',
  // }).then(console.log)
}

export default extractFromMainPage

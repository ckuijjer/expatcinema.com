import Xray from 'x-ray'
import { DateTime } from 'luxon'
import xRayPuppeteer from '../xRayPuppeteer'

import { logger as parentLogger } from '../powertools'
import { Screening } from 'types'

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
  //   .driver(xRayPuppeteer({ logger }))
  .concurrency(10)
  .throttle(10, 300)

type XRayFromMainPage = {
  title: string
  url: string
}

type XRayFromMoviePage = {
  jsonLd: string
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
  title // e.g. Nordic Watching: Unruly (English subtitled)
    .replace(/\s+\(.*?\)$/i, '') // e.g. (English subtitled)
    .replace(/^.*?:\s+/, '') // e.g. Nordic Watching:

const hasEnglishSubtitles = (title: string) =>
  title.toLowerCase().includes('english subtitled')

const extractFromMoviePage = async ({ url }: { url: string }) => {
  logger.info('movie page', { url })

  // #content so we get the 2nd JSON-LD script tag
  const scrapeResult: XRayFromMoviePage = await xray(url, '#content', {
    jsonLd: 'script[type="application/ld+json"]',
  })

  logger.info('scrape result', { scrapeResult })

  const screeningEvents: ScreeningEvent[] = JSON.parse(scrapeResult.jsonLd)

  const screenings: Screening[] = screeningEvents
    .filter((screeningEvent) => hasEnglishSubtitles(screeningEvent.name))
    .map((screeningEvent) => {
      return {
        title: cleanTitle(screeningEvent.name),
        url: screeningEvent.url,
        cinema: 'Lab-1',
        date: DateTime.fromISO(screeningEvent.startDate).toJSDate(),
      }
    })

  logger.info('screenings', { screenings })
  return screenings
}

const extractFromMainPage = async () => {
  try {
    logger.info('main page')

    // scraping google cache as lab111 blocks the scraper lambda
    const scrapeResult: XRayFromMainPage[] = await xray(
      'https://www.lab-1.nl/bioscoopagenda/',
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
      await Promise.all(
        scrapeResult
          .filter((movie) => hasEnglishSubtitles(movie.title))
          .map(extractFromMoviePage),
      )
    ).flat()

    logger.info('screenings found', { screenings })

    return screenings
  } catch (error) {
    logger.error('error scraping lab1', { error })
  }
}

if (require.main === module) {
  extractFromMainPage()
    .then((x) => JSON.stringify(x, null, 2))
    .then(console.log)

  //   extractFromMoviePage({
  //     url: 'https://www.lab-1.nl/film/nordic-watching-unruly-english-subtitled/',
  //   }).then(console.log)
}

export default extractFromMainPage

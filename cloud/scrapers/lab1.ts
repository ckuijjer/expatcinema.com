import { DateTime } from 'luxon'

import { logger as parentLogger } from '../powertools'
import { Screening } from '../types'
import { extractYearFromTitle } from './utils/extractYearFromTitle'
import { findDirectorInLines } from './utils/cleanDirector'
import { titleCase } from './utils/titleCase'
import { createXray } from '../xRay'

const logger = parentLogger.createChild({
  persistentLogAttributes: {
    scraper: 'lab1',
  },
})

const xray = createXray({
  filters: {
    cleanTitle: (value) =>
      typeof value === 'string' ? value.replace(/\(.*\)\s+$/, '') : value,
  },
  logger,
})

type XRayFromMainPage = {
  title: string
  url: string
}

type XRayFromMoviePage = {
  date: string
  subtitles: string
}

type XRayFromMovieMetadata = {
  metadata: string[]
  screenings: XRayFromMoviePage[]
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
      .replace(/\s*Laatste kans!/i, '') // e.g. <sup>Laatste kans!</sup> badge
      .replace(/\s+\(.*?\)$/i, '') // e.g. (English subtitled)
      .replace(/^.*?:\s+/, ''), // e.g. Nordic Watching:
  )

// const hasEnglishSubtitles = (title: string) =>
//   title.toLowerCase().includes('english subtitled')

const hasEnglishSubtitles = (subtitles: string) => {
  return /ENG\s+SUBS/i.test(subtitles) // \s+ to catch whatever the &nbsp; in ENG&nbsp;SUBS becomes
}

const hasEnglishSubs = ({ subtitles }: XRayFromMoviePage) =>
  hasEnglishSubtitles(subtitles)

// A show on a page in the layout of most films has a <time datetime>. The page of
// "Film Lovers Tuesday", a weekly discussion club and not a film, is in an older
// layout, with the day and the time as text: its shows have no date to read
export const hasDate = ({ date }: Pick<XRayFromMoviePage, 'date'>) =>
  Boolean(date?.trim())

export const toScreenings = ({
  title,
  url,
  year,
  director,
  shows,
}: {
  title: string
  url: string
  year?: number
  director?: string
  shows: XRayFromMoviePage[]
}): Screening[] =>
  shows
    .filter(hasEnglishSubs)
    .filter(hasDate)
    .map(({ date }) => ({
      title: cleanTitle(title),
      year: year ?? extractYearFromTitle(title),
      director,
      url,
      cinema: 'Lab-1',
      date: extractDate(date),
    }))

const extractDate = (time: string) =>
  DateTime.fromISO(time, { zone: 'Europe/Amsterdam' }).toJSDate()

const extractMetadataYear = (metadata: string[]) => {
  const jaarField = metadata.find((entry) => /^jaar:/i.test(entry))
  const match = jaarField?.match(/\b((?:19|20)\d{2})\b/)

  return match?.[1] ? Number(match[1]) : undefined
}

const extractFromMoviePage = async ({
  url,
  title,
}: {
  url: string
  title: string
}) => {
  logger.debug('movie page', { url })

  // #content so we get the 2nd JSON-LD script tag
  // const scrapeResult: XRayFromMoviePage = await xray(url, '#content', {
  //   jsonLd: 'script[type="application/ld+json"]',
  // })
  // const screeningEvents: ScreeningEvent[] = JSON.parse(scrapeResult.jsonLd)

  const scrapeResult: XRayFromMovieMetadata = await xray(url, 'body', {
    metadata: ['.meta | normalizeWhitespace | trim'],
    screenings: xray('.shows a', [
      {
        date: 'time@datetime | trim',
        subtitles: '.subtitles | trim',
      },
    ]),
  })

  logger.debug('scrape result', { scrapeResult })

  const year = extractMetadataYear(scrapeResult.metadata ?? [])
  const director = findDirectorInLines(scrapeResult.metadata)

  const shows = scrapeResult.screenings ?? []
  const screenings = toScreenings({
    title,
    url,
    year,
    director,
    shows,
  })

  if (screenings.length < shows.filter(hasEnglishSubs).length) {
    logger.info('leaving out shows without a date', { url })
  }

  logger.debug('screenings', { screenings })
  return screenings
}

const extractFromMainPage = async () => {
  try {
    logger.debug('main page')

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

    logger.debug('scrape result', { scrapeResult })

    const screenings: Screening[] = (
      await Promise.all(scrapeResult.map(extractFromMoviePage))
    ).flat()

    logger.debug('screenings found', { screenings })

    return screenings
  } catch (error) {
    logger.error('error scraping lab1', { error })
    return []
  }
}

export default extractFromMainPage

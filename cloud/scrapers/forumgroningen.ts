import { DateTime } from 'luxon'

import { logger as parentLogger } from '../powertools'
import { Screening } from '../types'
import { guessYear } from './utils/guessYear'
import { makeScreeningsUniqueAndSorted } from './utils/makeScreeningsUniqueAndSorted'
import { fullMonthToNumberEnglish } from './utils/monthToNumber'
import { extractScreeningsFromPages } from './utils/extractScreeningsFromPages'
import { titleCase } from './utils/titleCase'
import { createXray } from '../xRay'

const logger = parentLogger.createChild({
  persistentLogAttributes: {
    scraper: 'forumgroningen',
  },
})

const cleanTitle = (value: string) =>
  titleCase(value)
    .replace(/^Movie:\s+/i, '')
    .replace(/^Film:\s+/i, '')
    .replace(/^Classics:\s+/i, '')
    .replace(/^Cinematic Beauty:\s+/i, '')
    .replace(/^Cinemasia:\s+/i, '')
    .replace(/^Movies That Matter:\s+/i, '')
    .replace(/^Framed Shorts:\s+/i, '')
    .replace(/^Film Lovers Tuesday:\s+/i, '')

const xray = createXray({
  filters: {
    cleanTitle: (value) =>
      typeof value === 'string' ? cleanTitle(value) : value,
  },
  logger,
})

type XRayFromMoviePage = {
  title: string
  credits?: { label: string; value: string }[]
  screenings: {
    date: string
    times: {
      time: string
      tags: string
    }[]
  }[]
}

type XRayFromMainPage = {
  title: string
  url: string
}[]

// The film page lists the year with the country and the director, e.g.
// <p class="title">Year</p><p class="content">1988</p>
// A film without a year has no such row, so there's no year then.
export const parseYear = (credits: { label?: string; value?: string }[]) => {
  const value = credits.find(({ label }) => label?.trim() === 'Year')?.value
  const year = /^\s*(\d{4})\s*$/.exec(value ?? '')?.[1]

  return year &&
    Number(year) >= 1888 &&
    Number(year) <= new Date().getFullYear() + 2
    ? Number(year)
    : undefined
}

const extractFromMoviePage = async ({
  url,
}: {
  url: string
}): Promise<Screening[]> => {
  const scrapeResult: XRayFromMoviePage = await xray(url, {
    title: 'h1.title | cleanTitle | trim',
    credits: xray('.credits-inside', [
      {
        label: '.title | normalizeWhitespace | trim',
        value: '.content | normalizeWhitespace | trim',
      },
    ]),
    screenings: xray('.calendar-day', [
      {
        date: '.calendar-day-head | normalizeWhitespace | trim',
        times: xray('.calendar-day-content .ticket-row', [
          {
            time: '.time | normalizeWhitespace | trim',
            tags: '.tag | cleanTitle | trim',
          },
        ]),
      },
    ]),
  })

  logger.debug('scrapeResult', { scrapeResult })

  const filmYear = parseYear(scrapeResult.credits ?? [])

  const screenings: Screening[] = scrapeResult.screenings.flatMap(
    ({ date, times }) => {
      return times
        .filter(({ tags }) => tags?.toLowerCase().includes('english subtitles'))
        .map(({ time }) => {
          const [dayOfWeek, dayString, monthString] = date.split(/\s+/)
          const day = Number(dayString)
          const month = fullMonthToNumberEnglish(monthString)
          const [startTime, endTime] = time.split(/ tot | till | - /)
          const { hour, minute } = DateTime.fromFormat(startTime, 'h:mm a')

          const year = guessYear({
            day,
            month,
            hour,
            minute,
          })

          return {
            title: scrapeResult.title,
            year: filmYear,
            url,
            cinema: 'Forum Groningen',
            date: DateTime.fromObject({
              year,
              day,
              month,
              hour,
              minute,
            }).toJSDate(),
          }
        })
    },
  )

  const uniqueSortedScreenings = makeScreeningsUniqueAndSorted(screenings)
  logger.debug('screenings', { screenings: uniqueSortedScreenings })
  return uniqueSortedScreenings
}

const extractFromMainPage = async (): Promise<Screening[]> => {
  // note that the program might have more expat-friendly movies than this page, however there's no
  // easy way to go through the entire agenda
  const url = 'https://forum.nl/en/whats-on/international-movie-night'

  const scrapedMovies = (
    (await xray(url, '.calendar-list .ticket-row', [
      {
        title: '.content .title | cleanTitle | trim',
        url: 'a@href',
      },
    ])) as XRayFromMainPage
  )
    .filter(({ url }) => url !== undefined) // remove movies without url (e.g. in the past)
    .map(({ title, url }) => ({
      title,
      url: url.split('?')[0], // remove e.g. ?date=21-09-2025
    }))

  // deduplicate movies based on url;
  const movies = [
    ...new Map(scrapedMovies.map((obj) => [obj.url, obj])).values(),
  ]

  logger.debug('extracted', { movies })

  const screenings = await extractScreeningsFromPages(
    movies,
    extractFromMoviePage,
    { logger, url: ({ url }) => url },
  )

  logger.debug('screenings', { screenings })

  return screenings
}

export default extractFromMainPage

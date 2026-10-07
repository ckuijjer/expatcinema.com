import { DateTime } from 'luxon'

import { logger as parentLogger } from '../powertools'
import { Screening } from '../types'
import { extractYearFromTitle } from './utils/extractYearFromTitle'
import { guessYear } from './utils/guessYear'
import { shortMonthToNumberDutch } from './utils/monthToNumber'
import { removeYearSuffix } from './utils/removeYearSuffix'
import { extractScreeningsFromPages } from './utils/extractScreeningsFromPages'
import { splitTime } from './utils/splitTime'
import { titleCase } from './utils/titleCase'
import { createXray } from '../xRay'

const logger = parentLogger.createChild({
  persistentLogAttributes: {
    scraper: 'lantarenvenster',
  },
})

const xray = createXray({ logger })

const hasEnglishSubtitles = ({ subtitles }: { subtitles: string }) =>
  subtitles === 'Engels ondertiteld'

const cleanTitle = (title: string) =>
  titleCase(
    removeYearSuffix(title.replace(/ - Expat Cinema Rotterdam$/i, '').trim()),
  )

type XRayFromMoviePage = {
  title: string
  year: string
  subtitles: string
  screenings: {
    date: string
    times: string[]
  }[]
}

// The film's year is listed with the country and the duration, e.g.
// <div class="cine-details"><div class="wp_theatre_prod_country">België</div>
// <div class="wp_theatre_prod_year">2026</div><div class="wp_theatre_prod_duration">127’</div></div>
// A surprise film has no year: the page only says "Surprise" for the country.
export const parseYear = (value?: string) => {
  const year = /^\s*(\d{4})\s*$/.exec(value ?? '')?.[1]

  return year &&
    Number(year) >= 1888 &&
    Number(year) <= new Date().getFullYear() + 2
    ? Number(year)
    : undefined
}

// `source` is the URL of the film page, or its HTML
export const extractScreeningsFromMovieSource = async (
  source: string,
  url: string,
): Promise<Screening[]> => {
  logger.debug('extracting', { url })

  const movie: XRayFromMoviePage = await xray(source, '.page-content-aside', {
    title: '.wp_theatre_prod_title',
    year: '.wp_theatre_prod_year | trim',
    subtitles: '.wp_theatre_prod_languages_subtitles | trim',
    screenings: xray('.wpt_production_login_form tr', [
      {
        date: 'th | trim',
        times: ['td | trim'],
      },
    ]),
  })

  logger.debug('extracted xray', { url, movie })

  if (!hasEnglishSubtitles(movie)) return []

  const year = parseYear(movie.year) ?? extractYearFromTitle(movie.title)

  const screenings: Screening[] = movie.screenings
    .map(({ date, times }) => {
      return times
        .filter((time) => time) // remove empty times
        .map((time) => {
          const [dayOfWeek, dayString, monthString] = date.split(' ')
          const day = Number(dayString)

          const month = shortMonthToNumberDutch(monthString)
          const [hour, minute] = splitTime(time)

          const screeningYear = guessYear({
            day,
            month,
            hour,
            minute,
          })

          return {
            title: cleanTitle(movie.title),
            year,
            url,
            cinema: 'Lantarenvenster',
            date: DateTime.fromObject({
              day,
              month,
              hour,
              minute,
              year: screeningYear,
            }).toJSDate(),
          }
        })
    })
    .flat()

  logger.debug('extracting done', { url, screenings })

  return screenings
}

export const extractFromMoviePage = (url: string) =>
  extractScreeningsFromMovieSource(url, url)

type XRayFromMainPage = {
  url: string
  title: string
}

const extractFromMainPage = async () => {
  logger.debug('extracting main page')

  const xrayResult: XRayFromMainPage[] = await xray(
    'https://www.lantarenvenster.nl/#all',
    '.wp_theatre_event.film-groep',
    [
      {
        url: '> a@href',
        title: '.wp_theatre_event_title',
      },
    ],
  )

  const uniqueUrls = Array.from(new Set(xrayResult.map((x) => x.url)))

  logger.debug('main page', { uniqueUrls })

  const screenings = await extractScreeningsFromPages(
    uniqueUrls,
    extractFromMoviePage,
    { logger },
  )

  return screenings
}

export default extractFromMainPage

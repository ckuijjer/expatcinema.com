import got from 'got'
import { DateTime } from 'luxon'

import { logger as parentLogger } from '../powertools'
import { Screening } from '../types'
import { guessYear } from './utils/guessYear'
import { fullMonthToNumberEnglish } from './utils/monthToNumber'
import { extractScreeningsFromPages } from './utils/extractScreeningsFromPages'
import { runIfMain } from './utils/runIfMain'
import { splitTime } from './utils/splitTime'
import { titleCase } from './utils/titleCase'
import { createXray } from '../xRay'

const logger = parentLogger.createChild({
  persistentLogAttributes: {
    scraper: 'lux',
  },
})

const xray = createXray({ logger })

type XRayFromMoviePage = {
  title: string
  screenings: {
    date: string
    times: string[]
  }[]
}

type MainPageItem = {
  id: number
  title: string
  permalink: string
  subTitleLanguage?: string
  genre?: { terms?: { id: number }[] }
  releaseDate?: {
    date?: string
    dateTime?: {
      date?: string
    }
  }
}

const cleanTitle = (title: string) =>
  titleCase(
    title
      .replace(/^English Subs [–-] /i, '') // remove subs from the title using two different types of dashes
      .replace(/^English Subs: /i, ''), // remove subs from the title using a colon
  )

const splitFirstDate = (date: string) => {
  if (date === 'Vandaag') {
    const { day, month, year } = DateTime.now()
    return { day, month, year }
  } else if (date === 'Morgen') {
    const { day, month, year } = DateTime.now().plus({ days: 1 })
    return { day, month, year }
  } else {
    // b.v. ma 11.12
    const [dayOfWeek, dayString, monthString] = date.split(/ |\./) // space or dot

    const day = Number(dayString)
    const month = Number(monthString)

    return { day, month }
  }
}

const extractReleaseYear = (item: MainPageItem) => {
  const dateString = item.releaseDate?.dateTime?.date ?? item.releaseDate?.date
  const match = dateString?.match(/\b((?:19|20)\d{2})\b/)

  return match?.[1] ? Number(match[1]) : undefined
}

const extractFromMoviePage = async ({
  title,
  permalink: url,
  ...item
}: MainPageItem) => {
  // url example 'https://www.lux-nijmegen.nl/programma/english-subs-perfect-days/'

  const data: XRayFromMoviePage = await xray(url, 'body', {
    title: 'h2.header-programme__title  | trim',
    screenings: xray('.programme-tickets-popup__day', [
      {
        date: '.programme-tickets-popup__label | trim',
        times: ['.component-times__inner | trim'],
      },
    ]),
  })

  const screenings: Screening[] = data.screenings.flatMap(({ date, times }) => {
    let { day, month, year } = splitFirstDate(date)
    year = guessYear({ day, month, year })

    return times.flatMap((time) => {
      const [hour, minute] = splitTime(time)

      return {
        title: cleanTitle(data.title),
        year: extractReleaseYear({ title, permalink: url, ...item }),
        url,
        cinema: 'Lux',
        date: DateTime.fromObject({
          day,
          month,
          hour,
          minute,
          year,
        }).toJSDate(),
      }
    })
  })

  logger.debug('extracted screenings', { screenings })
  return screenings
}

type MainPageResponse = {
  items: MainPageItem[]
}

const ENGLISH_SUBS_GENRE_ID = 122

// Lux marks English-subtitled films inconsistently: some have the "English
// subs" genre, some an "English Subs - " title prefix, some only
// subTitleLanguage "Engels". Accept any of them.
const hasEnglishSubtitles = (item: MainPageItem) =>
  (item.genre?.terms ?? []).some(({ id }) => id === ENGLISH_SUBS_GENRE_ID) ||
  /^English Subs\b/i.test(item.title) ||
  item.subTitleLanguage?.toLowerCase() === 'engels'

const extractFromMainPage = async () => {
  // The discover endpoint rejects requests without a cache-key header matching
  // the body. An empty filter returns the whole programme.
  const body = JSON.stringify({
    types: [],
    genres: [],
    tags: [],
    search: '',
    isVerwacht: false,
  })

  const response: MainPageResponse = await got(
    'https://www.lux-nijmegen.nl/wp-json/lux/v1/discover',
    {
      headers: {
        accept: '*/*',
        'accept-language': 'en-US,en;q=0.9',
        'cache-key': body,
        'content-type': 'application/json',
      },
      body,
      method: 'POST',
    },
  ).json()

  const items = response.items.filter(hasEnglishSubtitles)

  logger.debug('main page', { items })

  const screenings = await extractScreeningsFromPages(
    items,
    extractFromMoviePage,
    { logger, url: ({ permalink }) => permalink },
  )

  logger.debug('main page', { screenings })

  return screenings
}

runIfMain(extractFromMainPage, import.meta.url)

export default extractFromMainPage

import { DateTime } from 'luxon'

import { logger as parentLogger } from '../powertools'
import { Screening } from '../types'
import { guessYear } from './utils/guessYear'
import { shortMonthToNumberDutch } from './utils/monthToNumber'
import { extractScreeningsFromPages } from './utils/extractScreeningsFromPages'
import { runIfMain } from './utils/runIfMain'
import { splitTime } from './utils/splitTime'
import { titleCase } from './utils/titleCase'
import { createXray } from '../xRay'

const logger = parentLogger.createChild({
  persistentLogAttributes: {
    scraper: 'natlab',
  },
})

const xray = createXray({ logger })

type XRayFromMainPage = {
  url: string
  title: string
}

type NatlabMoviePage = {
  title: string
  screenings: {
    date: string
    times: string[]
  }[]
  metadata: {
    key: string[]
    value: string[]
  }
  genres: string[]
}

const cleanTitle = (title: string) =>
  titleCase(
    title
      .replace(/ \| Expat Cinema$/i, '')
      .replace(/ \(English Subs\)$/i, '')
      .replace(/ \[Eng Subs\]$/i, ''),
  )

const extractFromMoviePage = async ({
  url,
  title,
}: XRayFromMainPage): Promise<Screening[]> => {
  const scrapeResult = (await xray(url, {
    title: 'h1 | normalizeWhitespace | trim',
    screenings: xray('.subshow', [
      {
        date: '.date | normalizeWhitespace | trim',
        times: ['.movie-time-start | normalizeWhitespace | trim'],
      },
    ]),
    metadata: xray('.metaWrapper .infoList', {
      key: ['dt | normalizeWhitespace | trim'],
      value: ['dd | normalizeWhitespace | trim'],
    }),
    genres: ['.meta .genres li | normalizeWhitespace | trim'],
  })) as NatlabMoviePage

  logger.debug('movie page', { scrapeResult })

  // example
  // {"title":"The Zone of Interest | Expat Cinema","screenings":[{"date":"zo 14 apr","times":["14:30"]}]}}
  const metadata = Object.fromEntries(
    scrapeResult.metadata.key.map((key: string, index: number) => [
      key,
      scrapeResult.metadata.value[index],
    ]),
  )
  logger.debug('metadata', { metadata })

  if (
    !(
      metadata.Ondertiteling?.includes('Engels') ||
      scrapeResult.genres.includes('ENGELSE ONDERTITELING') ||
      scrapeResult.title.includes('[Eng Subs]')
    )
  ) {
    logger.debug('no English subtitles', { url, title })
    return []
  }

  logger.debug('screenings', { screenings: scrapeResult.screenings })

  const screenings: Screening[] = scrapeResult.screenings.flatMap(
    (screening: NatlabMoviePage['screenings'][number]) => {
      return screening.times.map((time: string) => {
        const [_dayOfWeek, dayString, monthString] = screening.date.split(/\s+/)
        const day = Number(dayString)

        const month = shortMonthToNumberDutch(monthString)
        const [hour, minute] = splitTime(time)

        const year = guessYear({
          day,
          month,
          hour,
          minute,
        })

        const date = DateTime.fromObject({
          year,
          day,
          month,
          hour,
          minute,
        }).toJSDate()

        return {
          title: cleanTitle(scrapeResult.title),
          url,
          cinema: 'Natlab',
          date,
        }
      })
    },
  )

  logger.debug('screenings', { screenings })
  return screenings
}

const extractFromMainPage = async () => {
  const url =
    'https://www.natlab.nl/nl/programma/film?start=&end=&genres%5B%5D=119' // genre 119 = FILM

  const scrapeResult: XRayFromMainPage[] = await xray(
    url,
    '.listWrapper ul li',
    [
      {
        url: 'a.desc@href',
        title: 'a h2.title',
      },
    ],
  )

  logger.debug('main page', { scrapeResult })

  const screenings = await extractScreeningsFromPages(
    scrapeResult,
    extractFromMoviePage,
    { logger },
  )

  logger.debug('screenings', { screenings })

  return screenings
}

runIfMain(extractFromMainPage, import.meta.url)

export default extractFromMainPage

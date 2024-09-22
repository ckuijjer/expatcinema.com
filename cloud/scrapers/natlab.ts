import { DateTime } from 'luxon'
import Xray from 'x-ray'

import { logger as parentLogger } from '../powertools'
import { Screening } from '../types'
import { guessYear } from './utils/guessYear'
import { shortMonthToNumberDutch } from './utils/monthToNumber'
import { splitTime } from './utils/splitTime'
import { titleCase } from './utils/titleCase'

const logger = parentLogger.createChild({
  persistentLogAttributes: {
    scraper: 'natlab',
  },
})

const xray = Xray({
  filters: {
    trim: (value) => (typeof value === 'string' ? value.trim() : value),
    normalizeWhitespace: (value) =>
      typeof value === 'string' ? value.replace(/\s+/g, ' ') : value,
  },
})
  .concurrency(10)
  .throttle(10, 300)

type XRayFromMainPage = {
  url: string
  title: string
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
  const scrapeResult = await xray(url, {
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
  })

  logger.info('movie page', { scrapeResult })

  // example
  // {"title":"The Zone of Interest | Expat Cinema","screenings":[{"date":"zo 14 apr","times":["14:30"]}]}}
  const metadata = Object.fromEntries(
    scrapeResult.metadata.key.map((key: string, index: number) => [
      key,
      scrapeResult.metadata.value[index],
    ]),
  )
  logger.info('metadata', { metadata })

  if (
    !(
      metadata.Ondertiteling?.includes('Engels') ||
      scrapeResult.genres.includes('ENGELSE ONDERTITELING') ||
      scrapeResult.title.includes('[Eng Subs]')
    )
  ) {
    logger.warn('no English subtitles', { url, title })
    return []
  }

  logger.info('screenings', { screenings: scrapeResult.screenings })

  const screenings: Screening[] = scrapeResult.screenings.flatMap(
    (screening) => {
      return screening.times.map((time: string) => {
        const [dayOfWeek, day, monthString] = screening.date.split(/\s+/)

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

  logger.info('screenings', { screenings })
  return screenings
}

const extractFromMainPage = async () => {
  const url =
    'https://www.natlab.nl/nl/programma/film?start=&end=&genres%5B%5D=194' // genre 194 = ENGELSE ONDERTITELING

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

  logger.info('main page', { scrapeResult })

  const screenings = (
    await Promise.all(scrapeResult.map(extractFromMoviePage))
  ).flat()

  logger.info('screenings', { screenings })

  return screenings
}

if (require.main === module) {
  extractFromMoviePage({
    url: 'https://www.natlab.nl/nl/programma/7263/zar-amir-ebrahimi-guy-nattiv/tatami-eng-subs',
    title: '',
  })
    .then((x) => JSON.stringify(x, null, 2))
    .then(console.log)

  extractFromMainPage()
    .then((x) => JSON.stringify(x, null, 2))
    .then(console.log)
}

export default extractFromMainPage

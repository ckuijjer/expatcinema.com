import Xray from 'x-ray'
import { Screening } from 'types'
import { DateTime } from 'luxon'

import guessYear from './utils/guessYear'
import { logger as parentLogger } from '../powertools'
import { shortMonthToNumberDutch } from './utils/monthToNumber'
import splitTime from './utils/splitTime'

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
  title.replace(/ \| Expat Cinema$/i, '').replace(/ \(English Subs\)$/i, '')

const extractFromMoviePage = async ({
  url,
  title,
}: XRayFromMainPage): Promise<Screening[]> => {
  const scrapeResult = await xray(url, {
    title: 'h1 | normalizeWhitespace | trim',
    screenings: xray('#subshowList .subshow', [
      {
        date: '.date | normalizeWhitespace | trim',
        times: ['.movie-time-start | normalizeWhitespace | trim'],
      },
    ]),
    metadata: xray('.metaWrapper .infoList', {
      key: ['dt | normalizeWhitespace | trim'],
      value: ['dd | normalizeWhitespace | trim'],
    }),
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

  if (!metadata.Ondertiteling?.includes('Engels')) {
    logger.warn('no English subtitles', { url, title })
    return []
  }

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
  const url = 'https://www.natlab.nl/nl/programma/film?start=&end=' // genre 194 = ENGELSE ONDERTITELING

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
  //   extractFromMoviePage({
  //     url: 'https://www.natlab.nl/nl/programma/7001/jonathan-glazer/the-zone-of-interest-expat-cinema',
  //     //     url: 'https://www.natlab.nl/nl/programma/6970/jelle-de-jonge/de-terugreis?part1_artist_or_title=jelle-de-jonge&part2_title=de-terugreis',
  //   })
  //     .then((x) => JSON.stringify(x, null, 2))
  //     .then(console.log)

  extractFromMainPage()
    .then((x) => JSON.stringify(x, null, 2))
    .then(console.log)
}

export default extractFromMainPage

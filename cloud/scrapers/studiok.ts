import { DateTime } from 'luxon'
import pRetry from 'p-retry'
import Xray from 'x-ray'

import { logger as parentLogger } from '../powertools'
import { Screening } from '../types'
import guessYear from './utils/guessYear'
import { shortMonthToNumberDutch } from './utils/monthToNumber'
import splitTime from './utils/splitTime'

const logger = parentLogger.createChild({
  persistentLogAttributes: {
    scraper: 'studiok',
  },
})

const cleanTitle = (title: string) =>
  title.replace('(ENG SUBS)', '').replace(/^.*│/, '').trim()

const xray = Xray({
  filters: {
    trim: (value) => (typeof value === 'string' ? value.trim() : value),
    normalizeWhitespace: (value) =>
      typeof value === 'string' ? value.replace(/\s+/g, ' ') : value,
  },
})
  .concurrency(3)
  .throttle(3, 600)
  .timeout('5s')

type XRayFromMoviePage = {
  title: string
  meta: string
  timetable: {
    date: string
    times: string[]
    subtitles: string[]
  }[]
}

const extractFromMoviePage = async (url: string) => {
  const movie: XRayFromMoviePage = await xray(url, 'body', {
    title: 'h1 | normalizeWhitespace | trim',
    meta: '.meta',
    timetable: xray('#shows li[id]', [
      {
        date: '.sday | trim',
        times: ['.stime | normalizeWhitespace | trim'],
        subtitles: ['.subtitles | normalizeWhitespace | trim'],
      },
    ]),
  })

  logger.info('movie', { movie })

  const screenings: Screening[] = movie.timetable
    .flatMap(({ date, times, subtitles }) => {
      const [dayOfWeek, dayString, monthString] = date.split(' ')
      const day = Number(dayString)
      const month = shortMonthToNumberDutch(monthString)

      const timesAndSubtitles = times.map((time, index) => ({
        title: movie.title,
        subtitle: subtitles[index],
        time,
      }))

      return timesAndSubtitles
        .filter(({ subtitle, title }) => {
          return (
            subtitle?.toLowerCase().includes('english') ||
            subtitle?.toLowerCase().includes('engels') ||
            title.includes('ENG SUBS')
          )
        })
        .map(({ time, title }) => {
          const [hour, minute] = splitTime(time)
          const year = guessYear({
            day,
            month,
            hour,
            minute,
          })

          return {
            title: cleanTitle(title),
            url,
            cinema: 'Studio/K',
            date: DateTime.fromObject({
              day,
              month,
              hour,
              minute,
              year,
            }).toJSDate(),
          }
        })
        .filter((x) => x)
    })
    .flat()

  logger.info('screenings', { screenings })
  return screenings
}

type XRayFromMainPage = {
  url: string
}

const extractFromMainPage = async (): Promise<Screening[]> => {
  const scrapeResult: XRayFromMainPage[] = await xray(
    'https://studio-k.nu/films/',
    '.poster-lijst a',
    [
      {
        url: '@href',
      },
    ],
  )

  logger.info('main page', { scrapeResult })

  const uniqueUrls = Array.from(new Set(scrapeResult.map((x) => x.url)))

  logger.info('uniqueUrls', { uniqueUrls, length: uniqueUrls.length })

  const screenings = await (
    await Promise.all(
      uniqueUrls.map(async (url, i) => {
        return pRetry(
          async () => {
            const result = await extractFromMoviePage(url)
            return result
          },
          {
            onFailedAttempt: (error) => {
              logger.warn(
                `Scraping ${i} ${url}, attempt ${error.attemptNumber} failed. There are ${error.retriesLeft} retries left.`,
              )
            },
            retries: 5,
          },
        )
      }),
    )
  )
    .filter((x) => x)
    .flat()

  return screenings
}

if (require.main === module) {
  extractFromMainPage()
    .then((x) => JSON.stringify(x, null, 2))
    .then(console.log)

  // extractFromMoviePage(
  //   // 'https://studio-k.nu/film/cinema-kulinair-%e2%94%82-a-simple-life-2011/',
  //   // 'https://studio-k.nu/film/cinema-kulinair-%e2%94%82-eat-drink-man-woman-1994/',
  //   // 'https://studio-k.nu/film/boiling-point/',
  //   'https://studio-k.nu/film/cinema-kulinair-%e2%94%82io-sono-lamore-2009/',
  // ).then(console.log)
}

export default extractFromMainPage

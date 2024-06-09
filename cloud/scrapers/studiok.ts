import { DateTime } from 'luxon'
import pRetry from 'p-retry'
import Xray from 'x-ray'

import { logger as parentLogger } from '../powertools'
import { Screening } from '../types'
import { guessYear } from './utils/guessYear'
import { makeScreeningsUniqueAndSorted } from './utils/makeScreeningsUniqueAndSorted'
import { shortMonthToNumberDutch } from './utils/monthToNumber'
import { removeYearSuffix } from './utils/removeYearSuffix'
import { splitTime } from './utils/splitTime'
import { titleCase } from './utils/titleCase'

const logger = parentLogger.createChild({
  persistentLogAttributes: {
    scraper: 'studiok',
  },
})

const cleanTitle = (title: string) => {
  return titleCase(
    removeYearSuffix(
      title
        .replace('(ENG SUBS)', '') // Melk -> Melk
        .replace(/^.*│/, '')
        .replace(/ • .*$/, '') // SWEPT AWAY (1974) • I’LL HAVE WHAT SHE’S HAVING -> SWEPT AWAY (1974)
        .trim(),
    ),
  )
}

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
  // Note that in the browser .slick-slide instead of .slider is used, due to JavaScript being enabled
  const scrapeResult: XRayFromMainPage[] = await xray(
    'https://studio-k.nu/',
    '.poster-categories .slider a',
    [
      {
        url: '@href',
        title: '.txt | normalizeWhitespace | trim',
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

  const uniqueAndSortedScreenings = makeScreeningsUniqueAndSorted(screenings)
  return uniqueAndSortedScreenings
}

if (require.main === module) {
  extractFromMainPage()
    .then((x) => JSON.stringify(x, null, 2))
    .then(console.log)

  // extractFromMoviePage(
  //   'https://studio-k.nu/film/melk-eng-subs/',
  //   // 'https://studio-k.nu/film/melk/',
  // ).then(console.log)
}

export default extractFromMainPage

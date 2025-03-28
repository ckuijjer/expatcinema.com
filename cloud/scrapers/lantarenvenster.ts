import { DateTime } from 'luxon'
import Xray from 'x-ray'

import { logger as parentLogger } from '../powertools'
import { Screening } from '../types'
import { guessYear } from './utils/guessYear'
import { shortMonthToNumberDutch } from './utils/monthToNumber'
import { removeYearSuffix } from './utils/removeYearSuffix'
import { splitTime } from './utils/splitTime'
import { titleCase } from './utils/titleCase'

const logger = parentLogger.createChild({
  persistentLogAttributes: {
    scraper: 'lantarenvenster',
  },
})

const xray = Xray({
  filters: {
    trim: (value) => (typeof value === 'string' ? value.trim() : value),
  },
})
  .concurrency(10)
  .throttle(10, 300)

const hasEnglishSubtitles = ({ subtitles }: { subtitles: string }) =>
  subtitles === 'Engels ondertiteld'

const cleanTitle = (title: string) =>
  titleCase(
    removeYearSuffix(title.replace(/ - Expat Cinema Rotterdam$/i, '').trim()),
  )

type XRayFromMoviePage = {
  title: string
  subtitles: string
  screenings: {
    date: string
    times: string[]
  }[]
}

export const extractFromMoviePage = async (
  url: string,
): Promise<Screening[]> => {
  logger.info('extracting', { url })

  const movie: XRayFromMoviePage = await xray(url, '.page-content-aside', {
    title: '.wp_theatre_prod_title',
    subtitles: '.wp_theatre_prod_languages_subtitles | trim',
    screenings: xray('.wpt_production_login_form tr', [
      {
        date: 'th | trim',
        times: ['td | trim'],
      },
    ]),
  })

  logger.info('extracted xray', { url, movie })

  if (!hasEnglishSubtitles(movie)) return []

  const screenings: Screening[] = movie.screenings
    .map(({ date, times }) => {
      return times
        .filter((time) => time) // remove empty times
        .map((time) => {
          const [dayOfWeek, dayString, monthString] = date.split(' ')
          const day = Number(dayString)

          const month = shortMonthToNumberDutch(monthString)
          const [hour, minute] = splitTime(time)

          const year = guessYear({
            day,
            month,
            hour,
            minute,
          })

          return {
            title: cleanTitle(movie.title),
            url,
            cinema: 'Lantarenvenster',
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
    .flat()

  logger.info('extracting done', { url, screenings })

  return screenings
}

type XRayFromMainPage = {
  url: string
  title: string
}

const extractFromMainPage = async () => {
  logger.info('extracting main page')

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

  logger.info('main page', { uniqueUrls })

  const screenings = await Promise.all(uniqueUrls.map(extractFromMoviePage))

  logger.info('before flatten', { screenings })

  return screenings.flat()
}

export default extractFromMainPage

if (
  (typeof module === 'undefined' || module.exports === undefined) && // running in ESM
  import.meta.url === new URL(import.meta.url).href // running as main module, not importing from another module
) {
  extractFromMainPage()
    .then((x) => JSON.stringify(x, null, 2))
    .then(console.log)
}

// Promise.resolve([
//   {
//     url: 'https://www.lantarenvenster.nl/programma/rivers-edge/',
//   },
//   { url: 'https://www.lantarenvenster.nl/programma/la-priere/' },
//   { url: 'https://www.lantarenvenster.nl/programma/think-again-junpei/' },
// ])
//   .then(R.uniq) // as the agenda has lots of duplicate movie urls, make it unique
//   .then(log('main page'))
//   .then(results => Promise.all(results.map(extractFromMoviePage)))
//   // .then(results => results.filter(x => x))
//   .then(results => results.flat())
//   .then(log('done'))

// extractFromMoviePage({
//   url: 'https://www.lantarenvenster.nl/programma/think-again-junpei/',
// })
// extractFromMoviePage({
//   url: 'https://www.lantarenvenster.nl/programma/kanazawa-shutter-girl/',
// })

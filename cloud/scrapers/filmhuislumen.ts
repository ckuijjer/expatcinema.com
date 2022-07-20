import Xray from 'x-ray'
import { DateTime } from 'luxon'
import debugFn from 'debug'
import { shortMonthToNumber } from './monthToNumber'
import guessYear from './guessYear'
import { Screening } from '../types'

const debug = debugFn('filmhuislumen')

const splitTimeDot = (time) => time.split('.').map((x) => Number(x))

const xray = Xray({
  filters: {
    trim: (value) => (typeof value === 'string' ? value.trim() : value),
    cleanTitle: (value) =>
      typeof value === 'string' ? value.replace(/\(.*\)$/, '') : value,
    normalizeWhitespace: (value) =>
      typeof value === 'string' ? value.replace(/\s+/g, ' ') : value,
  },
})
  .concurrency(10)
  .throttle(10, 300)

type XRayFromMainPage = {
  title: string
  url: string
  dates: string[]
  rooms: {
    times: string[]
  }[]
}

const extractFromMainPage = async () => {
  // look at the HTML for the page, not Chrome' DevTools, as there's JavaScript that changed the HTML.
  const scrapeResults: XRayFromMainPage[] = await xray(
    'https://www.filmhuis-lumen.nl/deze-week/',
    '.wp_theatre_prod',
    [
      {
        url: '.wp_theatre_prod_title a@href',
        title: '.wp_theatre_prod_title  a | cleanTitle | trim',
        dates: [
          '.wpt_production_timetable tr:first-child th:not(:first-child)',
        ],
        rooms: xray('.wpt_production_timetable tr:not(:first-child)', [
          {
            times: ['td'],
          },
        ]),
      },
    ],
  )

  debug('scraped /deze-week %j', scrapeResults)

  const screenings = (
    await Promise.all(scrapeResults.map(extractFromMoviePage))
  ).flat()

  debug('screens %O', screenings)

  return screenings
}

const hasEnglishSubtitles = ({ metadata }: { metadata: string }) =>
  metadata.includes('Engels ondertiteld')

const extractFromMoviePage = async ({
  url,
  title,
  dates,
  rooms,
}: XRayFromMainPage): Promise<Screening[]> => {
  // All information about the movie, e.g. date, times is on the main page, we need to reuse it.
  // Not all information is available on the movie page though. The only thing available on the movie
  // page that isn't available on the main page is the subtitle metadata

  debug('extracting %s', url)

  const scrapeResult = await xray(url, '.timetable', {
    metadata: '.theatre-post-info | normalizeWhitespace | trim',
  })

  debug('scraped %s %J', url, scrapeResult)

  if (!hasEnglishSubtitles(scrapeResult)) {
    debug('hasEnglishSubtitles false %s', url)
    return []
  }

  // convert to a list of screenings
  const screenings: Screening[] = dates
    .flatMap((date, i) => {
      const [dayOfWeek, dayString, monthString] = date.split(' ')

      const day = Number(dayString)
      const month = shortMonthToNumber(monthString)

      return rooms.map(({ times }) => {
        const time = times[i]
        if (time === '') return undefined // skip empty times

        const [hour, minute] = splitTimeDot(time)
        const year = guessYear(
          DateTime.fromObject({
            day,
            month,
            hour,
            minute,
          }),
        )

        const screening = {
          url,
          title,
          cinema: 'Filmhuis Lumen',
          date: DateTime.fromObject({
            day,
            month,
            hour,
            minute,
            year,
          }).toJSDate(),
        }
        return screening
      })
    })
    .filter((x) => x)

  debug('extracted %s: %O', url, screenings)

  return screenings
}

if (require.main === module) {
  extractFromMainPage()
    .then((x) => JSON.stringify(x, null, 2))
    .then(console.log)

  // extractFromMoviePage({
  //   url: 'https://filmhuis-lumen.nl/film/the-last-bus-premiere/',
  //   title: 'The Last Bus',
  //   dates: [
  //     'do 21 jul',
  //     'vr 22 jul',
  //     'za 23 jul',
  //     'zo 24 jul',
  //     'ma 25 jul',
  //     'di 26 jul',
  //     'wo 27 jul',
  //   ],
  //   rooms: [
  //     { times: ['', '19.00', '19.00', '15.00', '', '', ''] },
  //     { times: ['19.30', '', '', '', '', '', '19.30'] },
  //   ],
  // })
  //   .then((x) => JSON.stringify(x, null, 2))
  //   .then(console.log)
}

export default extractFromMainPage

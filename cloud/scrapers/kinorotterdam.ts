import Xray from 'x-ray'
import { DateTime } from 'luxon'
import debugFn from 'debug'
import splitTime from './splitTime'
import { shortMonthToNumber } from './monthToNumber'
import guessYear from './guessYear'

import { Screening } from '../types'

const debug = debugFn('kinorotterdam')

const xray = Xray({
  filters: {
    trim: (value) => (typeof value === 'string' ? value.trim() : value),
    normalizeWhitespace: (value) =>
      typeof value === 'string' ? value.replace(/\s+/g, ' ') : value,
  },
})
  .concurrency(10)
  .throttle(10, 300)

const hasEnglishSubtitles = ({ title = '', movieMetadata = '' }) =>
  /Ondertiteling:\s*English/.test(movieMetadata) ||
  /Ondertiteling:\s*Engels/.test(movieMetadata) ||
  title.startsWith('Expat Arthouse: ') ||
  title.startsWith('KINO Expat: ') ||
  title.startsWith('KINO Expat Special: ')

type XRayFromMoviePage = {
  title: string
  timetable: {
    date: string
    times: string[]
  }[]
}

const extractDate = (date: string) => {
  if (date === 'Vandaag') {
    return {
      day: DateTime.now().day,
      month: DateTime.now().month,
    }
  }

  if (date === 'Morgen') {
    const { day, month } = DateTime.now().plus({ days: 1 })
    return { day, month }
  }

  const [dayOfWeek, dayString, monthString] = date.split(' ')
  return { day: Number(dayString), month: shortMonthToNumber(monthString) }
}

const extractFromMoviePage = async (url: string) => {
  const movie: XRayFromMoviePage = await xray(url, 'body', {
    title: '.hero__title | trim',
    timetable: xray('.timetable__date', [
      {
        date: '.timetable__day | trim',
        times: ['.timetable__times .btn--time | normalizeWhitespace | trim'],
      },
    ]),
  })

  debug('movie', movie)

  const screenings: Screening[] = movie.timetable
    .map(({ date, times }) => {
      const { day, month } = extractDate(date)

      return times
        .map((time) => {
          if (!time.includes(' EN subs')) {
            return
          }

          const [hour, minute] = splitTime(time.split(' ')[0])

          const year = guessYear(
            DateTime.fromObject({
              day,
              month,
              hour,
              minute,
            }),
          )

          return {
            title: movie.title,
            url,
            cinema: 'Kino',
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

  debug('screenings', screenings)
  return screenings
}

type XRayFromMainPage = {
  url: string
}

const extractFromMainPage = async (): Promise<Screening[]> => {
  const scrapeResult: XRayFromMainPage[] = await xray(
    'https://kinorotterdam.nl/agenda/?faf=all',
    'section.js_filter_agenda article:not([data-showtimes="0"])',
    [
      {
        url: 'a@href',
      },
    ],
  )

  debug('main page', scrapeResult)

  const uniqueUrls = Array.from(new Set(scrapeResult.map((x) => x.url)))

  debug('uniqueUrls', uniqueUrls)
  debug('uniqueUrls length', uniqueUrls.length)

  const screenings = await (
    await Promise.all(uniqueUrls.map(extractFromMoviePage))
  )
    .filter((x) => x)
    .flat()

  return screenings
}

if (require.main === module) {
  // extractFromMainPage()
  //   .then((x) => JSON.stringify(x, null, 2))
  //   .then(console.log)

  extractFromMoviePage(
    'https://kinorotterdam.nl/films/cameron-on-film-aliens-1986/',
    // 'https://kinorotterdam.nl/films/encore/',
  ).then(console.log)
}

export default extractFromMainPage

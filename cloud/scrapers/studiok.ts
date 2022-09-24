import Xray from 'x-ray'
import { DateTime } from 'luxon'
import debugFn from 'debug'
import splitTime from './splitTime'
import { shortMonthToNumber } from './monthToNumber'
import guessYear from './guessYear'

import { Screening } from '../types'

const debug = debugFn('studiok')

const cleanTitle = (title: string) =>
  title.replace('(ENG SUBS)', '').replace(/^.*│/, '').trim()

const xray = Xray({
  filters: {
    trim: (value) => (typeof value === 'string' ? value.trim() : value),
    normalizeWhitespace: (value) =>
      typeof value === 'string' ? value.replace(/\s+/g, ' ') : value,
  },
})
  .concurrency(1)
  .throttle(10, 300)

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

  debug('movie %j', movie)

  const screenings: Screening[] = movie.timetable
    .flatMap(({ date, times, subtitles }) => {
      const [dayOfWeek, dayString, monthString] = date.split(' ')
      const day = Number(dayString)
      const month = shortMonthToNumber(monthString)

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
          const year = guessYear(
            DateTime.fromObject({
              day,
              month,
              hour,
              minute,
            }),
          )

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

  debug('screenings', screenings)
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
  extractFromMainPage()
    .then((x) => JSON.stringify(x, null, 2))
    .then(console.log)

  // extractFromMoviePage(
  //   // 'https://studio-k.nu/film/cinema-kulinair-%e2%94%82-a-simple-life-2011/',
  //   'https://studio-k.nu/film/cinema-kulinair-%e2%94%82-eat-drink-man-woman-1994/',
  // ).then(console.log)
}

export default extractFromMainPage

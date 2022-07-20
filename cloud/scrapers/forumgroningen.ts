import Xray from 'x-ray'
import { DateTime } from 'luxon'
import debugFn from 'debug'
import guessYear from './guessYear'
import { Screening } from '../types'

const debug = debugFn('forumgroningen')

const xray = Xray({
  filters: {
    trim: (value) => (typeof value === 'string' ? value.trim() : value),
    cleanTitle: (value) =>
      typeof value === 'string' ? value.replace('Movie: ', '') : value,
    normalizeWhitespace: (value) =>
      typeof value === 'string' ? value.replace(/\s+/g, ' ') : value,
  },
})
  .concurrency(10)
  .throttle(10, 300)

type XRayFromMainPage = {
  date: string
  time: string
  title: string
}

const extractFromMainPage = async (): Promise<Screening[]> => {
  const url = 'https://forum.nl/en/whats-on/international-movie-night'

  const scrapeResults: XRayFromMainPage[] = await xray(url, '.calendar-day', [
    {
      date: '.calendar-day-head | normalizeWhitespace | trim',
      time: '.calendar-day-content .time div | normalizeWhitespace | trim',
      title: '.calendar-day-content .time .warning | cleanTitle | trim',
    },
  ])

  debug('scraped', scrapeResults)

  const screenings = scrapeResults
    .filter((x) => x.title !== undefined)
    .map(({ title, date, time }) => {
      const format = 'cccc d LLLL H:mm'

      let d = DateTime.fromFormat(
        `${date} ${time.split(/ till /)[0]}`,
        format,
        {
          zone: 'Europe/Amsterdam',
        },
      )

      const year = guessYear(date)
      d = d.set({ year })

      return {
        url,
        title,
        date: d.toJSDate(),
        cinema: 'Forum Groningen',
      }
    })

  debug('extracted', screenings)

  return screenings
}

if (require.main === module) {
  extractFromMainPage()
    .then((x) => JSON.stringify(x, null, 2))
    .then(console.log)
}

export default extractFromMainPage

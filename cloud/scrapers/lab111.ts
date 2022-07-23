import Xray from 'x-ray'
import { DateTime } from 'luxon'
import debugFn from 'debug'
import splitTime from './splitTime'
import { shortMonthToNumber } from './monthToNumber'
import guessYear from './guessYear'

const debug = debugFn('lab111')

const xray = Xray({
  filters: {
    trim: (value) => (typeof value === 'string' ? value.trim() : value),
    cleanTitle: (value) =>
      typeof value === 'string' ? value.replace(/\(.*\)\s+$/, '') : value,
    normalizeWhitespace: (value) =>
      typeof value === 'string' ? value.replace(/\s+/g, ' ') : value,
  },
})
  .concurrency(10)
  .throttle(10, 300)

const hasEnglishSubtitles = (movie: XRayFromMainPage) =>
  movie.metadata.includes('Ondertiteling: Engels')

const cleanTitle = (title: string) =>
  title.replace(' (with English subtitles)', '')

type XRayFromMainPage = {
  title: string
  url: string
  metadata: string
  dates: string[]
}

const extractFromMainPage = async () => {
  // scraping google cache as lab111 blocks the scraper lambda
  const scrapeResult: XRayFromMainPage[] = await xray(
    'http://webcache.googleusercontent.com/search?q=cache:https://www.lab111.nl/programma/',
    '#programmalist .filmdetails',
    [
      {
        title: 'h2.hidemobile a | trim | cleanTitle',
        url: 'h2.hidemobile a@href | trim',
        metadata: '.row.hidemobile | normalizeWhitespace',
        dates: ['.day td:first-child | trim'],
      },
    ],
  )

  const screenings = scrapeResult
    .filter(hasEnglishSubtitles)
    .flatMap((movie) => {
      return movie.dates.map((date) => {
        const [dayOfWeek, dayString, monthString, time] = date.split(/\s+/)
        const day = Number(dayString)
        const month = shortMonthToNumber(monthString)
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
          title: cleanTitle(movie.title),
          url: movie.url,
          cinema: 'Lab111',
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

  return screenings
}

if (require.main === module) {
  extractFromMainPage()
    .then((x) => JSON.stringify(x, null, 2))
    .then(console.log)

  // extractFromMoviePage({
  //   url: 'https://www.lab111.nl/movie/tampopo/',
  // }).then(console.log)
}

export default extractFromMainPage

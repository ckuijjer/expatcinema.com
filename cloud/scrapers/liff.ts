import Xray from 'x-ray'
import * as R from 'ramda'
import { DateTime } from 'luxon'
import debugFn from 'debug'
import splitTime from './splitTime'
import { shortMonthToNumber } from './monthToNumber'
import guessYear from './guessYear'

const debug = debugFn('liff')

const debugPromise =
  (format, ...debugArgs) =>
  (arg) => {
    debug(format, ...debugArgs, arg)
    return arg
  }

const xray = Xray({
  filters: {
    trim: (value) => (typeof value === 'string' ? value.trim() : value),
  },
})
  .concurrency(10)
  .throttle(10, 300)

const hasEnglishSubtitles = (movie) =>
  movie.metadata.filter((x) => x === 'SubtitlesEnglish').length === (1).flat()

const extractFromMoviePage = ({ url }) => {
  debug('extracting %s', url)

  return xray(url, 'body', {
    title: '.film-title span | trim',
    metadata: ['.bg-yellow p'],
    firstScreening: xray('.padding-box', {
      date: 'h3',
      time: 'span.prog-date',
    }),
    restScreenings: xray('.data-stroke .data-stroke-item', [
      {
        date: '.h3',
        time: '.h4',
      },
    ]),
  })
    .then(debugPromise('extracted xray %s: %O', url))
    .then((movie) => {
      if (!hasEnglishSubtitles(movie)) return []

      const format = 'cccc d MMMM H:mm'

      const date = movie.firstScreening.date
      const time = movie.firstScreening.time.match(/[\d:]*/)[0] // 17:00 - 18:35 \r\n\r\n-\r\n\r\n'

      const screenings = [
        DateTime.fromFormat(`${date} ${time}`, format).toUTC().toISO(),
        ...movie.restScreenings.map((screening) => {
          const time = screening.time.match(/[\d:]*/)[0] // 17:00 - 18:35 \r\n\r\n-\r\n\r\n'

          const dayIndex = screening.date.match(/\d+/).index // 'Thursday8 November'
          const date = [
            screening.date.slice(0, dayIndex),
            screening.date.slice(dayIndex),
          ].join(' ')

          return DateTime.fromFormat(`${date} ${time}`, format).toUTC().toISO()
        }),
      ]

      return screenings.map((screening) => ({
        title: movie.title,
        url,
        date: screening,
        cinema: 'LIFF - Multiple locations',
      }))
    })
    .then(debugPromise('extracting done %s: %O', url))
}

const extractFromMainPage = () => {
  return xray('https://www.liff.nl/en/Program/Program-A-Z', '.program-block', [
    {
      url: 'a@href',
      title: 'a',
    },
  ])
    .then(debugPromise('main page: %J'))
    .then((results) => Promise.all(results.map(extractFromMoviePage)))
    .then(debugPromise('before flatten: %j'))
    .then((results) => results.flat())
}

if (require.main === module) {
  extractFromMainPage()
    .then((x) => JSON.stringify(x, null, 2))
    .then(console.log)

  // extractFromMoviePage({
  //   url: 'https://www.liff.nl/en/Program/Movie/and-breathe-normally/750',
  // })
}

export default extractFromMainPage

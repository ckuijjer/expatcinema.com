import Xray from 'x-ray'
import * as R from 'ramda'
import { DateTime } from 'luxon'

import splitTime from './splitTime'
import { shortMonthToNumberDutch } from './monthToNumber'
import guessYear from './guessYear'

import { logger as parentLogger } from '../powertools'

const logger = parentLogger.createChild({
  persistentLogAttributes: {
    scraper: 'liff',
  },
})

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
  logger.info('extracting', { url })

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
  }).then((movie) => {
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
}

const extractFromMainPage = () => {
  return xray('https://www.liff.nl/en/Program/Program-A-Z', '.program-block', [
    {
      url: 'a@href',
      title: 'a',
    },
  ])
    .then((results) => Promise.all(results.map(extractFromMoviePage)))
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

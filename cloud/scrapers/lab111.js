const Xray = require('x-ray')
const R = require('ramda')
const { DateTime } = require('luxon')
const debug = require('debug')('lab111')
const splitTime = require('./splitTime')
const { shortMonthToNumber } = require('./monthToNumber')
const guessYear = require('./guessYear')

const debugPromise = (format, ...debugArgs) => arg => {
  debug(format, ...debugArgs, arg)
  return arg
}

const xray = Xray({
  filters: {
    trim: value => (typeof value === 'string' ? value.trim() : value),
  },
})
  .concurrency(10)
  .throttle(10, 300)

const hasEnglishSubtitles = movie => {
  const metadata = {}
  movie.meta.forEach(({ key, value }) => (metadata[key] = value))

  return (
    metadata.Subtitles === 'Engels' ||
    movie.titleMeta.includes('Engels ondertiteld')
  )
}

const flatten = (acc, cur) => [...acc, ...cur]

const extractFromMoviePage = ({ url }) => {
  debug('extracting %s', url)

  return xray(url, 'body', {
    title: 'h1',
    titleMeta: ['.zmovietitel h5'],
    meta: xray('.zmovie-meta', [
      {
        key: 'h4 | trim',
        value: 'li | trim',
      },
    ]),
    screenings: xray('.kaartjes tr', [
      {
        date: 'td:nth-child(1) | trim',
        time: 'td:nth-child(2) | trim',
      },
    ]),
  })
    .then(debugPromise('extracted xray %s: %j', url))
    .then(movie => {
      if (!hasEnglishSubtitles(movie)) return []

      return movie.screenings.map(({ date, time }) => {
        const [dayOfWeek, dayString, monthString] = date.split(/\s+/)
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
          title: movie.title,
          url,
          cinema: 'Lab111',
          date: DateTime.fromObject({
            day,
            month,
            hour,
            minute,
            year,
          })
            .toUTC()
            .toISO(),
        }
      })
    })
    .then(debugPromise('extracting done %s: %O', url))
}

const extractFromMainPage = () => {
  return xray('https://www.lab111.nl', '.agenda tr td:nth-child(2)', [
    {
      url: 'a@href',
      title: 'a | trim',
    },
  ])
    .then(R.uniq) // as the agenda has lots of duplicate movie urls, make it unique
    .then(debugPromise('main page: %J'))
    .then(results => Promise.all(results.map(extractFromMoviePage)))
    .then(debugPromise('before flatten: %j'))
    .then(results => results.reduce(flatten, []))
}

if (require.main === module) {
  extractFromMainPage()
    .then(x => JSON.stringify(x, null, 2))
    .then(console.log)

  // extractFromMoviePage({
  //   url: 'https://www.lab111.nl/movie/parasite/',
  // }).then(console.log)
}

module.exports = extractFromMainPage

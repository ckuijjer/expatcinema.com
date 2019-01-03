// TODO: totally copy pasted from springhaver. That has to be better

const Xray = require('x-ray')
const R = require('ramda')
const { DateTime } = require('luxon')
const debug = require('debug')('hartlooper')
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
  .concurrency(3)
  .throttle(3, 300)

const hasEnglishSubtitles = movie =>
  movie.title.toLowerCase().includes('english subtitles')

const flatten = (acc, cur) => [...acc, ...cur]

const cleanTitle = title =>
  title.replace(/\s*[-\(]\s*english subtitles\)?/i, '')

const extractFromMoviePage = ({ url }) => {
  debug('extracting %s', url)

  return xray(url, 'body', {
    title: '.title h1',
    screenings: xray('.reserveerwrap td', [
      {
        date: xray('a', {
          day: '.dag | trim',
          month: '.maand.mobile | trim',
        }),
        times: ['.tijd | trim'],
      },
    ]),
  })
    .then(debugPromise('extracted xray %s: %j', url))
    .then(movie => {
      if (!hasEnglishSubtitles(movie)) return []

      return movie.screenings
        .map(({ date, times }) =>
          times.map(time => {
            const day = +date.day
            const month = shortMonthToNumber(date.month)
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
              url,
              cinema: 'Louis Hartlooper Complex',
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
          }),
        )
        .reduce(flatten, [])
    })
    .then(debugPromise('extracting done %s: %O', url))
}

const extractFromMainPage = () => {
  return xray(
    'https://www.hartlooper.nl/film-overzicht',
    '#schedule_nuinbios tr',
    xray('tr', [
      // nesting xray doesn't make any sense, `#schedule_nuinbios tr` should work and return a list, not a single result
      // think it somehow starts counting from the beginning of the selector?
      {
        title: 'h2 a',
        url: 'h2 a@href',
      },
    ]),
  )
    .then(debugPromise('main page: %J'))
    .then(results => results.filter(hasEnglishSubtitles))
    .then(debugPromise('main page with english subtitles: %J'))
    .then(results => Promise.all(results.map(extractFromMoviePage)))
    .then(debugPromise('before flatten: %j'))
    .then(results => results.reduce(flatten, []))
}

if (require.main === module) {
  extractFromMainPage()
    .then(x => JSON.stringify(x, null, 2))
    .then(console.log)
  // extractFromMoviePage({
  //   url: 'https://www.springhaver.nl/movies/1458/17/blackkklansman',
  // })
}

module.exports = extractFromMainPage

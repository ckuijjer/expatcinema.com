const Xray = require('x-ray')
const R = require('ramda')
const { DateTime } = require('luxon')
const got = require('got')
const debug = require('debug')('springhaver')
const splitTime = require('./splitTime')
const { fullMonthToNumber } = require('./monthToNumber')
const guessYear = require('./guessYear')

const debugPromise = (format, ...debugArgs) => (arg) => {
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
  movie.title.toLowerCase().includes('language no problem')

const flatten = (acc, cur) => [...acc, ...cur]

const cleanTitle = (title) => title.replace(/Language No Problem: /i, '')

const extractFromMoviePage = ({ url }) => {
  debug('extracting %s', url)

  return xray(url, 'body', {
    title: '.intro-content h1',
    screenings: xray('.play-times td', [
      {
        date: xray('a', {
          day: '.day | trim',
          month: '.month | trim',
        }),
        times: ['.time span | trim'],
      },
    ]),
  })
    .then(debugPromise('extracted xray %s: %j', url))
    .then((movie) => {
      if (!hasEnglishSubtitles(movie)) return []

      return movie.screenings
        .map(({ date, times }) =>
          times.map((time) => {
            const day = +date.day
            const month = fullMonthToNumber(date.month)
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
              cinema: 'Springhaver',
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

const extractFromMainPage = () =>
  got(
    'https://www.springhaver.nl/wp-admin/admin-ajax.php?action=get_movies&day=movies',
  )
    .json()
    .then((movies) => {
      console.log({ movies })
      return movies.map(({ post_title, link }) => ({
        title: post_title,
        url: link,
      }))
    })
    .then(debugPromise('main page: %J'))
    .then((results) => results.filter(hasEnglishSubtitles))
    .then(debugPromise('main page with english subtitles: %J'))
    .then((results) => Promise.all(results.map(extractFromMoviePage)))
    .then(debugPromise('before flatten: %j'))
    .then((results) => results.reduce(flatten, []))

if (require.main === module) {
  extractFromMainPage()
    .then((x) => JSON.stringify(x, null, 2))
    .then(console.log)
  // extractFromMoviePage({
  //   url: 'https://www.springhaver.nl/movies/1458/17/blackkklansman',
  // })
}

module.exports = extractFromMainPage

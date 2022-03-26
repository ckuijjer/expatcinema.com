const Xray = require('x-ray')
const R = require('ramda')
const { DateTime } = require('luxon')
const debug = require('debug')('lantarenvenster')
const splitTime = require('./splitTime')
const { shortMonthToNumber } = require('./monthToNumber')
const guessYear = require('./guessYear')

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

const hasEnglishSubtitles = ({ subtitles }) =>
  subtitles === 'Engels ondertiteld'

const flatten = (acc, cur) => [...acc, ...cur]

const cleanTitle = (title) =>
  title.replace(/ - Expat Cinema Rotterdam$/i, '').trim()

const extractFromMoviePage = ({ url }) => {
  debug('extracting %s', url)

  return xray(url, '.page-content-aside', {
    title: '.wp_theatre_prod_title',
    subtitles: '.wp_theatre_prod_languages_subtitles | trim',
    screenings: xray('.wpt_production_login_form tr', [
      {
        date: 'th | trim',
        times: ['td | trim'],
      },
    ]),
  })
    .then(debugPromise('extracted xray %s: %j', url))
    .then((movie) => {
      if (!hasEnglishSubtitles(movie)) return []

      return movie.screenings
        .map(({ date, times }) => {
          return times
            .filter((time) => time) // remove empty times
            .map((time) => {
              const [dayOfWeek, dayString, monthString] = date.split(' ')
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
                url,
                cinema: 'Lantarenvenster',
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
        .reduce(flatten, [])
    })
    .then(debugPromise('extracting done %s: %O', url))
}

const extractFromMainPage = () => {
  debug('extracting main page')
  return (
    xray(
      'https://www.lantarenvenster.nl/#all',
      '.wp_theatre_event.film-groep',
      [
        {
          url: '> a@href',
          title: '.wp_theatre_event_title',
        },
      ],
    )
      .then(R.uniq) // as the agenda has lots of duplicate movie urls, make it unique
      .then(debugPromise('main page: %j'))
      .then((results) => Promise.all(results.map(extractFromMoviePage)))
      // .then(results => results.filter(x => x))
      .then(debugPromise('before flatten: %j'))
      .then((results) => results.reduce(flatten, []))
  )
}

{
  /* <div class="wp_theatre_prod_languages_subtitles">
			Engels ondertiteld		</div> */
}

module.exports = extractFromMainPage

if (require.main === module) {
  extractFromMainPage()
    .then((x) => JSON.stringify(x, null, 2))
    .then(console.log)
}

// Promise.resolve([
//   {
//     url: 'https://www.lantarenvenster.nl/programma/rivers-edge/',
//   },
//   { url: 'https://www.lantarenvenster.nl/programma/la-priere/' },
//   { url: 'https://www.lantarenvenster.nl/programma/think-again-junpei/' },
// ])
//   .then(R.uniq) // as the agenda has lots of duplicate movie urls, make it unique
//   .then(log('main page'))
//   .then(results => Promise.all(results.map(extractFromMoviePage)))
//   // .then(results => results.filter(x => x))
//   .then(results => results.reduce(flatten, []))
//   .then(log('done'))

// extractFromMoviePage({
//   url: 'https://www.lantarenvenster.nl/programma/think-again-junpei/',
// })
// extractFromMoviePage({
//   url: 'https://www.lantarenvenster.nl/programma/kanazawa-shutter-girl/',
// })

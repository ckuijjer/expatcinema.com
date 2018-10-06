const Xray = require('x-ray')
const R = require('ramda')
const { DateTime } = require('luxon')

const debug = require('debug')('kino')

const debugPromise = (format, ...debugArgs) => arg => {
  debug(format, ...debugArgs, arg)
  return arg
}
const xray = Xray()
  .concurrency(3)
  .throttle(3, 300)

const monthToNumber = month =>
  [
    'jan',
    'feb',
    'maa',
    'apr',
    'mei',
    'jun',
    'jul',
    'aug',
    'sep',
    'okt',
    'nov',
    'dec',
  ].indexOf(month) + 1

const hasEnglishSubtitles = (movieMetadata = '') =>
  movieMetadata.includes('Ondertiteling:  English')

const splitTime = time => time.split(':').map(x => Number(x))

const flatten = (acc, cur) => [...acc, ...cur]

const extractFromMoviePage = ({ url }) =>
  xray(url, 'body', {
    title: '.film-title',
    movieMetadata: '.film-gegevens',
    timetableToday: ['#myshows > li > a.stime'],
    timetableRest: xray('#myshows > li', [
      {
        date: '> a:not(.stime)',
        times: ['ul li a'],
      },
    ]),
  }).then(movie => {
    if (!hasEnglishSubtitles(movie.movieMetadata)) return

    const today = movie.timetableToday.map(time => {
      const [hour, minute] = splitTime(time)

      return DateTime.fromObject({
        hour,
        minute,
      })
        .toUTC()
        .toISO()
    })

    const dates = movie.timetableRest
      .filter(x => x.date !== undefined) // remove the empty { times: [] }
      .map(x =>
        x.times.map(time => {
          const [dayOfWeek, dayString, monthString] = x.date.split(' ')
          const day = Number(dayString)
          const month = monthToNumber(monthString)
          const [hour, minute] = splitTime(time)

          return DateTime.fromObject({
            day,
            month,
            hour,
            minute,
          })
            .toUTC()
            .toISO()
        }),
      )
      .concat([today])
      .map(dates =>
        dates.map(date => ({
          date,
          title: movie.title,
          url,
          cinema: 'Kino',
        })),
      )
      .reduce(flatten, [])

    return dates
  })

const extractFromMainPage = () => {
  return xray('https://kinorotterdam.nl/agenda/', 'tr.clickable-row', [
    {
      url: '.film-hover .content a@href',
    },
  ])
    .then(debugPromise('main page'))
    .then(R.uniq) // as the agenda has lots of duplicate movie urls, make it unique
    .then(results => Promise.all(results.map(extractFromMoviePage)))
    .then(results => results.filter(x => x))
    .then(results => results.reduce(flatten, []))
}

if (require.main === module) {
  // extractFromMainPage()
  //   .then(x => JSON.stringify(x, null, 2))
  //   .then(console.log)

  extractFromMoviePage({
    url: 'https://kinorotterdam.nl/film/tokyo-stories-youth-of-the-beast-1963/',
  }).then(console.log)
}

module.exports = extractFromMainPage

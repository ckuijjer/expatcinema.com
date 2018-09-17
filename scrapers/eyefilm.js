const Xray = require('x-ray')
const R = require('ramda')
const { DateTime } = require('luxon')
const debug = require('debug')('eyefilm')

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

const hasEnglishSubtitles = ({ subtitles }) => {
  debug('subtitles: %s', subtitles)
  return subtitles === 'Subtitles: English'
}

const splitTime = time => time.split(':').map(x => Number(x))

const flatten = (acc, cur) => [...acc, ...cur]

const extractFromMoviePage = ({ url }) => {
  debug('extracting %s', url)

  return xray(url, 'body', {
    title: 'h1',
    subtitles: '.field-movie-subtitles-raw | trim',
    screenings: xray('.date-item-list > li', [
      {
        date: '.program-date-day | trim',
        times: ['.program-date-time-wrapper | trim'],
      },
    ]),
  })
    .then(debugPromise('extracted xray %s: %j', url))
    .then(movie => {
      if (!hasEnglishSubtitles(movie)) return []

      return movie.screenings
        .map(({ date, times }) => {
          return times.map(time => {
            return {
              title: movie.title,
              url,
              cinema: 'Eyefilm',
              date: DateTime.fromFormat(`${date} ${time}`, 'dd MMM yyyy H:mm')
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
  return (
    xray('https://www.eyefilm.nl/en/film/all-films', '.calendar-all-films li', [
      {
        url: 'h3.full-program-title a@href',
        title: 'h3.full-program-title a | trim',
      },
    ])
      //   .then(R.uniq)
      .then(debugPromise('main page: %J'))
      .then(results => Promise.all(results.map(extractFromMoviePage)))
      .then(debugPromise('before flatten: %j'))
      .then(results => results.reduce(flatten, []))
      .then(x => console.log(JSON.stringify(x, null, 2)))
  )
}

extractFromMainPage()

// extractFromMoviePage({
//   url: 'https://www.eyefilm.nl/en/film/jigoku',
// })

// extractFromMoviePage({
//   url: 'https://www.eyefilm.nl/en/film/3-faces?program_id=11851109',
// })

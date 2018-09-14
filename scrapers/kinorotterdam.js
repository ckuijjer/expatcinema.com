const Xray = require('x-ray')
const xray = Xray()
const R = require('ramda')
const { DateTime } = require('luxon')

const DEBUG = false
const log = name => arg => {
  DEBUG && console.log(name, JSON.stringify(arg, null, 2))
  return arg
}

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
    .then(log('main page'))
    .then(R.uniq) // as the agenda has lots of duplicate movie urls, make it unique
    .then(results => Promise.all(results.map(extractFromMoviePage)))
    .then(results => results.filter(x => x))
    .then(results => results.reduce(flatten, []))
  // .then(results => results.reduce((acc, cur) => [...acc, ...cur], [])) // flatten, as there's can be more than one screening per page

  // .then(results =>
  //   Promise.all(
  //     results
  //       .filter(
  //         x =>
  //           x.hasEnglishSubtitlesIndicator1 === 'English subtitles' ||
  //           x.hasEnglishSubtitlesIndicator2 === 'English subtitles',
  //       )
  //       .map(extractFromMoviePage),
  //   ),
  // )
  // .then(results => results.reduce((acc, cur) => [...acc, ...cur], [])) // flatten, as there's can be more than one screening per page
}

extractFromMainPage().then(console.log)

// extractFromMoviePage({
//   // url:
//   // 'https://kinorotterdam.nl/film/studio-ghibli-when-marnie-was-there-2014/',
//   url: 'https://kinorotterdam.nl/film/expat-arthouse-dogman/',
//   // url: 'https://kinorotterdam.nl/film/blackkklansman/',
//   // url: 'https://kinorotterdam.nl/film/predator-the-2d/',
//   // url: 'https://kinorotterdam.nl/film/tokyo-stories-tokyo-story-1953/',
// }).then(log('results ='))

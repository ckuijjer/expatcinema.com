const Xray = require('x-ray')
const xray = Xray()
const R = require('ramda')
const { DateTime } = require('luxon')

const DEBUG = false

const log = name => arg => {
  DEBUG && console.log(name, arg)
  return arg
}

const extractFromMoviePage = ({ url }) => {
  return xray(url, 'body', [
    {
      title: '.spread__title',
      timetable: ['.timetable__date,.timetable__time'], // it's kinda shitty that x-ray only returns text and no subtree of the DOM
    },
  ])
    .then(log('movie page'))
    .then(results => results.map(r => ({ ...r, url }))) // add the movie page's url
    .map(r => {
      // timetable is e.g. [ 'wo 12 sep', '13.45', '20.45', 'wo 19 sep', '13.45', '20.45' ]
      // and needs to be parsed: first detect date vs time, then see which belongs together, then combine
      const { timetable, ...rest } = r

      // it's a time if it's of the form e.g. 13.45
      const isTime = x => !!x.match(/\d+.\d+/)

      // group them together if they're both times (in theory this would not be good, but as there's never two dates after each other, who cares)
      // output is e.g. [[ 'wo 12 sep' ], ['13.45', '20.45'], [ 'wo 19 sep' ], [ '13.45', '20.45' ]]
      const groupedTimeTable = R.groupWith(
        (a, b) => isTime(a) && isTime(b),
        timetable,
      )

      const dates = []
      for (var i = 0; i < groupedTimeTable.length; i = i + 2) {
        const date = groupedTimeTable[i][0].replace(/^\w+\s/, '') // 'wo 12 sep' => '12 sep'
        const times = groupedTimeTable[i + 1]

        times.forEach(time => {
          dates.push(
            DateTime.fromFormat(`${date} ${time}`, 'd LLL H.mm')
              .toUTC()
              .toISO(),
          ) // create a iso8601 using the date and the time
        })
      }

      return dates.map(date => ({
        ...rest,
        cinema: 'Filmhuis Den Haag',
        date,
      }))
    })
    .reduce((acc, cur) => [...acc, ...cur], []) // flatten, as there's can be more than one screening per page
}

const extractFromMainPage = () => {
  return xray('https://www.filmhuisdenhaag.nl/agenda/a-z', 'li.event-listed', [
    {
      title: 'h1.event-listed__title',
      url: 'a.event-listed__link@href',
      hasEnglishSubtitlesIndicator1:
        '.event-ticket-button.has-variant-title span',
      hasEnglishSubtitlesIndicator2: '.event-listed__header-group .label',
    },
  ])
    .then(log('main page'))
    .then(results =>
      Promise.all(
        results
          .filter(
            x =>
              x.hasEnglishSubtitlesIndicator1 === 'English subtitles' ||
              x.hasEnglishSubtitlesIndicator2 === 'English subtitles',
          )
          .map(extractFromMoviePage),
      ),
    )
    .then(results => results.reduce((acc, cur) => [...acc, ...cur], [])) // flatten, as there's can be more than one screening per page
}

extractFromMainPage().then(console.log)

// extractFromMoviePage({
//   url:
//     'https://www.filmhuisdenhaag.nl/agenda/event/reports-on-sarah-and-saleem-engelse-ondertiteling',
// }).then(console.log)

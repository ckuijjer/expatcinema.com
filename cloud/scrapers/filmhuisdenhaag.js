const Xray = require('x-ray')
const R = require('ramda')
const { DateTime } = require('luxon')
const debug = require('debug')('filmhuisdenhaag')
const { shortMonthToNumber } = require('./monthToNumber')
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

const hasEnglishSubtitles = ({ title = '', movieMetadata = '' }) =>
  movieMetadata.includes('OndertitelingEngels')

const extractFromMoviePage = ({ url }) => {
  return xray(url, 'body', [
    {
      title: '.spread__title',
      timetable: ['.timetable__date,.timetable__time'], // it's kinda shitty that x-ray only returns text and no subtree of the DOM
      movieMetadata: '.specs-list | trim',
    },
  ])
    .then(debugPromise('extracting %s', url))
    .then(
      (results) =>
        results
          .filter(hasEnglishSubtitles)
          .map((movie) => {
            // timetable is e.g. [ 'wo 12 sep', '13.45', '20.45', 'wo 19 sep', '13.45', '20.45' ]
            // and needs to be parsed: first detect date vs time, then see which belongs together, then combine
            const { timetable, title } = movie

            debug('movie %j', movie)
            debug('timetable %j', timetable)

            // it's a time if it's of the form e.g. 13.45
            const isTime = (x) => !!x.match(/\d+.\d+/)

            // group them together if they're both times (in theory this would not be good, but as there's never two dates after each other, who cares)
            // output is e.g. [[ 'wo 12 sep' ], ['13.45', '20.45'], [ 'wo 19 sep' ], [ '13.45', '20.45' ]]
            const groupedTimeTable = R.groupWith(
              (a, b) => isTime(a) && isTime(b),
              timetable,
            )

            debug('groupedTimeTable %j', groupedTimeTable)

            const dates = []
            for (var i = 0; i < groupedTimeTable.length; i = i + 2) {
              const [dayOfWeek, dayString, monthString] = groupedTimeTable[
                i
              ][0].split(/\s+/)
              const day = Number(dayString)
              const month = shortMonthToNumber(monthString)
              const times = groupedTimeTable[i + 1]

              debug('day, month, times %j', {
                dayString,
                monthString,
                day,
                month,
                times,
              })

              times.forEach((time) => {
                const [hour, minute] = time
                  .split(/\s+/)[0] // e.g. 20.15 Uitverkocht => 20.15
                  .split('.') // e.g. 20.15 to 20, 15
                  .map((x) => Number(x))
                const year = guessYear(
                  DateTime.fromObject({
                    day,
                    month,
                    hour,
                    minute,
                  }),
                )
                debug('hour, minute, time, year %j', {
                  hour,
                  minute,
                  time,
                  year,
                })

                dates.push(
                  DateTime.fromObject({
                    day,
                    month,
                    hour,
                    minute,
                    year,
                  })
                    .toUTC()
                    .toISO(),
                ) // create a iso8601 using the date and the time
              })
            }

            return dates.map((date) => ({
              title,
              url,
              cinema: 'Filmhuis Den Haag',
              date,
            }))
          })
          .reduce((acc, cur) => [...acc, ...cur], []), // flatten, as there's can be more than one screening per page
    )
}

const extractFromMainPage = () => {
  return xray('https://www.filmhuisdenhaag.nl/agenda/a-z', 'li.event-listed', [
    {
      title: 'h1.event-listed__title',
      url: 'a.event-listed__link@href',
    },
  ])
    .then(debugPromise('main page'))
    .then((results) => Promise.all(results.map(extractFromMoviePage)))
    .then((results) => results.reduce((acc, cur) => [...acc, ...cur], [])) // flatten, as there's can be more than one screening per page
}

if (require.main === module) {
  const R = require('ramda')
  const sort = R.sortWith([
    (a, b) => DateTime.fromISO(a.date) - DateTime.fromISO(b.date),
    R.ascend(R.prop('cinema')),
    R.ascend(R.prop('title')),
    R.ascend(R.prop('url')),
  ])

  extractFromMainPage()
    .then(sort)
    .then((x) => JSON.stringify(x, null, 2))
    .then(console.log)

  // extractFromMoviePage({
  // url: 'https://www.filmhuisdenhaag.nl/agenda/event/styx',
  // }).then(console.log)
}

module.exports = extractFromMainPage

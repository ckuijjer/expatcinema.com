const Xray = require('x-ray')
const R = require('ramda')
const { DateTime } = require('luxon')
const debug = require('debug')('filmhuisdenhaag')
const { shortMonthToNumber } = require('./monthToNumber')
const guessYear = require('./guessYear')

const debugPromise = (format, ...debugArgs) => arg => {
  debug(format, ...debugArgs, arg)
  return arg
}

const xray = Xray()
  .concurrency(3)
  .throttle(3, 300)

const extractFromMoviePage = ({ url }) => {
  return xray(url, 'body', [
    {
      title: '.spread__title',
      timetable: ['.timetable__date,.timetable__time'], // it's kinda shitty that x-ray only returns text and no subtree of the DOM
    },
  ])
    .then(debugPromise('extracting %s', url))
    .then(
      results =>
        results
          .map(movie => {
            // timetable is e.g. [ 'wo 12 sep', '13.45', '20.45', 'wo 19 sep', '13.45', '20.45' ]
            // and needs to be parsed: first detect date vs time, then see which belongs together, then combine
            const { timetable, title } = movie

            debug('movie %j', movie)

            // it's a time if it's of the form e.g. 13.45
            const isTime = x => !!x.match(/\d+.\d+/)

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

              times.forEach(time => {
                const [hour, minute] = time.split('.').map(x => Number(x))
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

            return dates.map(date => ({
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
      hasEnglishSubtitlesIndicator1:
        '.event-ticket-button.has-variant-title span',
      hasEnglishSubtitlesIndicator2: '.event-listed__header-group .label',
    },
  ])
    .then(debugPromise('main page'))
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

module.exports = extractFromMainPage

// extractFromMainPage().then(console.log)

// extractFromMoviePage({
//   url: 'https://www.filmhuisdenhaag.nl/agenda/event/somebody-clap-for-me',
// }).then(console.log)

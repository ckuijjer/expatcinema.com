const Xray = require('x-ray')
const { DateTime } = require('luxon')
const R = require('ramda')
const debug = require('debug')('filmhuislumen')
const { shortMonthToNumber } = require('./monthToNumber')
const guessYear = require('./guessYear')

const splitTimeDot = (time) => time.split('.').map((x) => Number(x))

const xray = Xray({
  filters: {
    trim: (value) => (typeof value === 'string' ? value.trim() : value),
    cleanTitle: (value) =>
      typeof value === 'string' ? value.replace(/\(.*\)$/, '') : value,
    normalizeWhitespace: (value) =>
      typeof value === 'string' ? value.replace(/\s+/g, ' ') : value,
  },
})
  .concurrency(10)
  .throttle(10, 300)

const extractFromMainPage = async () => {
  const thisWeekResults = await xray(
    'https://www.filmhuis-lumen.nl/deze-week/',
    '.wp_theatre_prod_title',
    [
      {
        url: 'a@href',
        title: 'a | cleanTitle | trim',
      },
    ],
  )
  debug('scraped /deze-week', thisWeekResults)

  const expectedResults = await xray(
    'https://www.filmhuis-lumen.nl/verwacht/',
    '.theater-show',
    [
      {
        url: 'a@href',
        title: 'a h3 | cleanTitle | trim',
      },
    ],
  )
  debug('scraped /verwacht', expectedResults)

  const results = [...thisWeekResults, ...expectedResults]
  const uniqueResults = R.uniq(results) // likely not needed, but just in case

  const extracted = await (
    await Promise.all(uniqueResults.map(extractFromMoviePage))
  ).flat()

  return extracted
}

const hasEnglishSubtitles = ({ metadata }) =>
  metadata.includes('Engels ondertiteld')

const extractFromMoviePage = async ({ url, title }) => {
  debug('extracting %s', url)

  const scrapeResult = await xray(url, '.timetable', {
    metadata: '.theatre-post-info | normalizeWhitespace | trim',
    dates: ['.datecontent tr:first-child th:not(:first-child)'],
    times: ['.datecontent tr:not(:first-child) td'],
  })

  if (!hasEnglishSubtitles(scrapeResult)) {
    debug('hasEnglishSubtitles false %s', url)

    return []
  }

  const numberOfDates = scrapeResult.dates.length

  const screenings = scrapeResult.dates.flatMap((date, i) => {
    const times = scrapeResult.times
      .filter((_, j) => j % numberOfDates === i) // keep only the times that belong to the current date (column)
      .filter((x) => x) // remove empty cells

    return times.map((time) => {
      const [dayOfWeek, dayString, monthString] = date.split(' ')
      const day = Number(dayString)
      const month = shortMonthToNumber(monthString)
      const [hour, minute] = splitTimeDot(time)
      const year = guessYear(
        DateTime.fromObject({
          day,
          month,
          hour,
          minute,
        }),
      )

      return {
        url,
        title,
        cinema: 'Filmhuis Lumen',
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

  debug('extracted %s: %O', url, screenings)

  return screenings
}

if (require.main === module) {
  extractFromMainPage()
    .then((x) => JSON.stringify(x, null, 2))
    .then(console.log)

  //   extractFromMoviePage({
  //     url:
  //       //     'https://www.filmhuis-lumen.nl/film/nur-eine-frau-deutsches-kino/',
  //       'https://www.filmhuis-lumen.nl/film/le-sorelle-macaluso-premiere/',
  //   })
  //     .then((x) => JSON.stringify(x, null, 2))
  //     .then(console.log)
}

module.exports = extractFromMainPage

const Xray = require('x-ray')
const { DateTime } = require('luxon')
const debug = require('debug')('forumgroningen')
const guessYear = require('./guessYear')

const xray = Xray({
  filters: {
    trim: (value) => (typeof value === 'string' ? value.trim() : value),
    cleanTitle: (value) =>
      typeof value === 'string' ? value.replace('Movie: ', '') : value,
    normalizeWhitespace: (value) =>
      typeof value === 'string' ? value.replace(/\s+/g, ' ') : value,
  },
})
  .concurrency(10)
  .throttle(10, 300)

const extractFromMainPage = async () => {
  const url = 'https://forum.nl/en/whats-on/international-movie-night'

  const scrapeResults = await xray(url, '.calendar-day', [
    {
      date: '.calendar-day-head | normalizeWhitespace | trim',
      time: '.calendar-day-content .time div | normalizeWhitespace | trim',
      title: '.calendar-day-content .time .warning | cleanTitle | trim',
    },
  ])

  debug('scraped', scrapeResults)

  const screenings = scrapeResults
    .filter((x) => x.title !== undefined)
    .map(({ title, date, time }) => {
      const format = 'cccc d LLLL H:mm'

      let d = DateTime.fromFormat(
        `${date} ${time.split(/ till /)[0]}`,
        format,
        {
          zone: 'Europe/Amsterdam',
        },
      )

      const year = guessYear(date)
      d = d.set({ year })

      return {
        url,
        title,
        date: d.toUTC().toISO(),
        cinema: 'Forum Groningen',
      }
    })

  debug('extracted', screenings)

  return screenings
}

if (require.main === module) {
  extractFromMainPage()
    .then((x) => JSON.stringify(x, null, 2))
    .then(console.log)
}

module.exports = extractFromMainPage

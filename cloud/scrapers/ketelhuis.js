const Xray = require('x-ray')
const { DateTime } = require('luxon')
const R = require('ramda')
const debug = require('debug')('ketelhuis')
const { shortMonthToNumber, fullMonthToNumber } = require('./monthToNumber')
const guessYear = require('./guessYear')
const splitTime = require('./splitTime')
const xRayPuppeteer = require('../xRayPuppeteer')

const xray = Xray({
  filters: {
    trim: (value) => (typeof value === 'string' ? value.trim() : value),
    cleanTitle: (value) =>
      typeof value === 'string'
        ? value.replace(/ – English subtitles$/, '')
        : value,
    normalizeWhitespace: (value) =>
      typeof value === 'string' ? value.replace(/\s+/g, ' ') : value,
  },
})
  .driver(xRayPuppeteer())
  .concurrency(10)
  .throttle(10, 300)

const extractFromMainPage = async () => {
  const selector = [
    {
      url: '@href',
      title: '',
    },
  ]

  const expatCinemaResults = await xray(
    'https://www.ketelhuis.nl/specials/expat-cinema/',
    '.c-default-page-content a[href^="https://www.ketelhuis.nl/films/"]',
    selector,
  )
  debug('scraped /expat-cinema', expatCinemaResults)

  const deutschesKinoResults = await xray(
    'https://www.ketelhuis.nl/specials/deutsches-kino/',
    '.c-default-page-content a[href^="https://www.ketelhuis.nl/films/"]',
    selector,
  )
  debug('scraped /deutsches-kino', deutschesKinoResults)

  const results = [...expatCinemaResults, ...deutschesKinoResults]
  const uniqueResults = R.uniq(results)

  debug('results', results)
  debug('uniqueResults', uniqueResults)

  const extracted = await (
    await Promise.all(uniqueResults.map(extractFromMoviePage))
  ).flat()

  return extracted
}

const hasEnglishSubtitles = ({ metadata, mainContent }) =>
  metadata?.includes('English subtitles') ||
  mainContent?.includes('Engels ondertiteld')

const extractFromMoviePage = async ({ url, title }) => {
  debug('extracting %s', url)

  const scrapeResult = await xray(url, {
    title: '.c-filmheader__content h1 > span | cleanTitle | trim',
    metadata: '.c-detail-info__filminfo | normalizeWhitespace',
    mainContent: '.c-main-content | normalizeWhitespace',
    firstDate: '.c-detail-schedule__firstday div:first-of-type',
    firstTimes: ['.c-detail-schedule__times a | normalizeWhitespace | trim'],
    other: xray('.c-detail-schedule-complete__wrapper li', [
      {
        date: '.c-detail-schedule-complete__date',
        times: ['.c-detail-schedule-complete__time'],
      },
    ]),
  })

  debug('extracted %s: %O', url, scrapeResult)

  if (!hasEnglishSubtitles(scrapeResult)) {
    debug('hasEnglishSubtitles false %s', url)

    return []
  }

  const firstDates = scrapeResult.firstTimes.map((time) => {
    const [dayOfWeek, dayString, monthString, year] =
      scrapeResult.firstDate.split(' ')
    const day = Number(dayString)
    const month = fullMonthToNumber(monthString)
    const [hour, minute] = splitTime(time)

    return DateTime.fromObject({
      day,
      month,
      hour,
      minute,
      year,
    })
      .toUTC()
      .toISO()
  })

  const otherDates = scrapeResult.other.flatMap(({ date, times }) => {
    const [dayOfWeek, dayString, monthString] = date.split(' ')
    const day = Number(dayString)
    const month = shortMonthToNumber(monthString)

    return times.map((time) => {
      const [hour, minute] = splitTime(time)
      const year = guessYear(
        DateTime.fromObject({
          day,
          month,
          hour,
          minute,
        }),
      )

      return DateTime.fromObject({
        day,
        month,
        hour,
        minute,
        year,
      })
        .toUTC()
        .toISO()
    })
  })

  const screenings = [...firstDates, ...otherDates].map((date) => ({
    date,
    url,
    cinema: 'Ketelhuis',
    url,
  }))

  debug('screenings %O', screenings)
  return screenings
}

if (require.main === module) {
  extractFromMainPage()
    .then((x) => JSON.stringify(x, null, 2))
    .then(console.log)

  // extractFromMoviePage({
  //   // url: 'https://www.ketelhuis.nl/films/quo-vadis-aida-english-subtitles/',
  //   // url: 'https://www.ketelhuis.nl/films/bad-luck-banging-or-loony-porn-english-subtitles/',
  //   // url: 'https://www.ketelhuis.nl/films/nur-eine-frau/',
  //   // url: 'https://www.ketelhuis.nl/films/le-sorelle-macaluso/',
  //   url: 'https://www.ketelhuis.nl/films/meskina/',
  // })
  //   .then((x) => JSON.stringify(x, null, 2))
  //   .then(console.log)
}

module.exports = extractFromMainPage

const Xray = require('x-ray')
const R = require('ramda')
const { DateTime } = require('luxon')
const debug = require('debug')('kriterion')

const debugPromise =
  (format, ...debugArgs) =>
  (arg) => {
    debug(format, ...debugArgs, arg)
    return arg
  }

const xray = Xray({
  filters: {
    trim: (value) => (typeof value === 'string' ? value.trim() : value),
    cleanTitle: (value) =>
      typeof value === 'string' ? value.replace(/ ENG SUBS$/, '') : value,
  },
})
  .concurrency(10)
  .throttle(10, 300)

const hasEnglishSubtitles = ({ metadata }) => {
  const hasEnglishSubtitles =
    metadata.includes('Ondertiteling Engels') ||
    metadata.includes('Ondertiteling English')
  debug('hasEnglishSubtitles: %s metadata %j', hasEnglishSubtitles, metadata)
  return hasEnglishSubtitles
}

const flatten = (acc, cur) => [...acc, ...cur]

const extractFromMoviePage = (...args) => {
  const { url } = args[0]
  debug('extracting %s %O', url, args)

  return xray(url, 'body', {
    metadata: ['#filmposter p'], // iterate to get "Ondertiteling Engels"
    sidebar: xray('li[typeof="schema:TheaterEvent"]', [
      {
        title: '[property="schema:name"] | trim | cleanTitle',
        url: 'span[property="schema:url"] | trim', // as the <a> has a ?start_date appended
        date: '[property="schema:startDate"]@datetime',
      },
    ]),
  })
    .then(debugPromise('extracted xray %s: %j', url))
    .then((movie) => {
      if (!hasEnglishSubtitles(movie)) return []

      return movie.sidebar
        .filter((x) => x.url === url) // only look at the sidebar items that are about the current movie
        .map(({ date, ...rest }) => ({
          ...rest,
          cinema: 'Kriterion',
          date: DateTime.fromISO(date).toUTC().toISO(),
        }))
    })
    .then(debugPromise('extracting done %s: %O', url))
}

// for now we only scrape movies that can be bought, so unfortunately not the ones
// a little more in the future (this will be harder to scrape as we need to parse the metadata which looks
// only semi structured, thus fragile. So now scraping of the main content '.highlightbox h4' but only
// the sidebar, and using the sidebar in extractFromMoviePage again so we only make one request for every
// movie, but still can easily get all the screenings
const extractFromMainPage = () => {
  return xray(
    'https://www.kriterion.nl/agenda-2-2-2-2',
    'li[typeof="schema:TheaterEvent"]',
    [
      {
        title: '[property="schema:name"] | trim',
        url: 'span[property="schema:url"] | trim', // as the <a> has a ?start_date appended
        date: '[property="schema:startDate"]@datetime',
      },
    ],
  )
    .then(debugPromise('main page before uniq: %j'))
    .then(R.uniqWith(R.eqBy(R.prop('url')))) // only do uniq based on url, as the title is different from the main and the sidebar
    .then(debugPromise('main page after uniq: %j'))
    .then((results) => Promise.all(results.map(extractFromMoviePage)))
    .then(debugPromise('before flatten: %j'))
    .then((results) => results.reduce(flatten, []))
}

if (require.main === module) {
  extractFromMainPage()
    .then((x) => JSON.stringify(x, null, 2))
    .then(console.log)

  // extractFromMoviePage({
  //   url: 'https://kriterion.nl/films/dogman',
  // }).then(console.log)
}

module.exports = extractFromMainPage

const Xray = require('x-ray')
const { DateTime } = require('luxon')
const got = require('got')
const debug = require('debug')('rialto')
const guessYear = require('./guessYear')

const xray = Xray({
  filters: {
    trim: (value) => (typeof value === 'string' ? value.trim() : value),
  },
})
  .concurrency(10)
  .throttle(10, 300)

const hasEnglishSubtitles = (movie) =>
  movie.metadata
    .map((x) => x.trim().toLowerCase())
    .includes('subtitles english')

const extractFromMoviePage = async ({ url }) => {
  debug('extracting %s', url)

  const movie = await xray(url, 'body', {
    title: 'h1.header__title',
    metadata: ['dl.detail .detail__row'], // iterate to get "Ondertiteling Engels"
  })

  debug('extracted xray %s: %j', url, movie)

  if (!hasEnglishSubtitles(movie)) return []

  // https://rialtofilm.nl/en/films/424/les-miserables => 424
  const movieId = url.split('/').reverse()[1]

  const data = await got(`https://rialtofilm.nl/feed/en/film/${movieId}`).json()

  debug('got the showings feed %s: %j', url, data)

  if (data.length === 0) {
    debug('feed without any showings %s', url)
    return []
  }

  const showings = Object.entries(data.Rialto).flatMap(([date, times]) =>
    times.map(({ time }) => {
      const format = 'cccc d MMMM H:mm'

      const { day, month, hour, minute } = DateTime.fromFormat(
        `${date} ${time}`,
        format,
      )

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
    }),
  )

  debug('extracted showings %s: %j', url, showings)

  const result = showings.map((date) => ({
    title: movie.title,
    url,
    cinema: 'Rialto',
    date,
  }))

  debug('extracting done %s: %O', url, result)

  return result
}

const extractFromMainPage = async () => {
  const movies = await xray('https://rialtofilm.nl/en/films', 'a.list__row', [
    {
      title: 'div.list-item__title',
      url: '@href',
    },
  ])

  debug('main page', movies)

  return (await Promise.all(movies.map(extractFromMoviePage))).flat()
}

if (require.main === module) {
  extractFromMainPage()
    .then((x) => JSON.stringify(x, null, 2))
    .then(console.log)
  //   extractFromMoviePage({
  // url: 'https://rialtofilm.nl/en/films/462/parasite-zw',
  // url: 'https://rialtofilm.nl/nl/films/426/the-lighthouse',
  // url: 'https://rialtofilm.nl/en/films/424/les-miserables',
  // url: 'https://rialtofilm.nl/en/films/481/ghost-tropic',
  //   })
}

module.exports = extractFromMainPage

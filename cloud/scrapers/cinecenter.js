const Xray = require('x-ray')
const debug = require('debug')('cinecenter')

const xray = Xray({
  filters: {
    trim: (value) => (typeof value === 'string' ? value.trim() : value),
  },
})
  .concurrency(10)
  .throttle(10, 300)

const cleanTitle = (title) => title.replace(/Cine Expat: /i, '')

const extractFromMoviePage = async ({ url }) => {
  debug('extracting %s', url)

  const movie = await xray(url, 'body', {
    title: 'h1.film_title',
    showings: [
      '.tickets .collapse:not([id=cinedinerkaarten]) a[data-timestamp]@data-timestamp',
    ],
  })

  debug('extracted xray %s: %j', url, movie)

  const result = movie.showings.map((showing) => ({
    title: cleanTitle(movie.title),
    url,
    cinema: 'Cinecenter',
    date: new Date(showing * 1000),
  }))

  debug('extracting done %s: %O', url, result)

  return result
}

const extractFromMainPage = async () => {
  const movies = await xray(
    'https://cinecenter.nl/film/?expat=true',
    'a.film-link',
    [
      {
        title: 'h3.entry-title',
        url: '@href',
      },
    ],
  )

  debug('main page', movies)

  return (await Promise.all(movies.map(extractFromMoviePage))).flat()
}

if (require.main === module) {
  extractFromMainPage()
    .then((x) => JSON.stringify(x, null, 2))
    .then(console.log)
  //   extractFromMoviePage({
  // url: 'https://cinecenter.nl/film/cine-expat-woman/?special=expat',
  // url: 'https://cinecenter.nl/film/cine-expat-system-crasher/?special=expat',
  //   })
}

module.exports = extractFromMainPage

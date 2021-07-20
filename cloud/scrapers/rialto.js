const Xray = require('x-ray')
const { DateTime } = require('luxon')
const debug = require('debug')('rialto')
const { JSDOM } = require('jsdom')

const guessYear = require('./guessYear')

const xray = Xray({
  filters: {
    trim: (value) => (typeof value === 'string' ? value.trim() : value),
  },
})
  .concurrency(10)
  .throttle(10, 300)

const extractFromMainPage = async () => {
  const url = 'https://rialtofilm.nl/en/specials/3/expat-monday'

  const movies = await xray(url, '.blocks__content div:nth-child(2)', {
    date: 'p em',
    showings: xray('.text-block__text p:nth-child(2)', {
      titles: ['a | trim'],
      urls: ['a@href'],
      raw: '@html',
    }),
  })

  const fragment = JSDOM.fragment(`<div>${movies.showings.raw}</div>`)
  movies.showings.times = Array.from(fragment.firstChild.childNodes)
    .filter((x) => x.nodeType === 3)
    .map((x) => x.textContent.toUpperCase().trim())

  movies.showings.dates = movies.showings.times.map(
    (time) => `${movies.date} ${time}`,
  )

  const format = 'cccc LLLL d h:mm a'

  const results = movies.showings.titles.map((title, i) => {
    let date = DateTime.fromFormat(movies.showings.dates[i], format, {
      zone: 'Europe/Amsterdam',
    })

    const year = guessYear(date)
    date = date.set({ year })

    return {
      title,
      url: movies.showings.urls[i],
      cinema: 'Rialto',
      date: date.toUTC().toISO(),
    }
  })

  debug('main page', JSON.stringify(results, null, 2))

  return results
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

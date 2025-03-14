import { DateTime } from 'luxon'
import Xray from 'x-ray'

import { logger as parentLogger } from '../powertools'
import { Screening } from '../types'

const logger = parentLogger.createChild({
  persistentLogAttributes: {
    scraper: 'cinecenter',
  },
})

const xray = Xray({
  filters: {
    trim: (value) => (typeof value === 'string' ? value.trim() : value),
  },
})
  .concurrency(10)
  .throttle(10, 300)

const cleanTitle = (title: string) =>
  title.replace(/Cine Expat: /i, '').replace(/^ENG SUBS: /i, '')

type XRayFromMoviePage = {
  title: string
  showings: number[]
}

const extractFromMoviePage = async ({ url }: { url: string }) => {
  logger.info('extracting', { url })

  const movie: XRayFromMoviePage = await xray(url, 'body', {
    title: 'h1.film_title',
    showings: [
      '.tickets .collapse:not([id=cinedinerkaarten]) a[data-timestamp]@data-timestamp',
    ],
  })

  logger.info('extracted xray', { url, movie })

  const result = movie.showings.map((showing) => ({
    title: cleanTitle(movie.title),
    url,
    cinema: 'Cinecenter',
    date: DateTime.fromMillis(showing * 1000, { zone: 'utc' })
      // the `showing` is in ms Amsterdam time, this way I try to hack the time back to UTC
      // wonder however if this is correct for times where it's close to midnight (and crosses a day boundary)
      .setZone('Europe/Amsterdam', { keepLocalTime: true })
      .toUTC(),
  }))

  logger.info('extracting done', { url, result })

  return result
}

type XRayFromMainPage = {
  title: string
  url: string
}

const extractFromMainPage = async (): Promise<Screening[]> => {
  const movies: XRayFromMainPage[] = await xray(
    'https://cinecenter.nl/film/?expat=true',
    'a.film-link',
    [
      {
        title: 'h3.entry-title',
        url: '@href',
      },
    ],
  )

  logger.info('main page', { movies })

  return (await Promise.all(movies.map(extractFromMoviePage))).flat()
}

if (
  (typeof module === 'undefined' || module.exports === undefined) && // running in ESM
  import.meta.url === new URL(import.meta.url).href // running as main module, not importing from another module
) {
  extractFromMainPage()
    .then((x) => JSON.stringify(x, null, 2))
    .then(console.log)
  //   extractFromMoviePage({
  // url: 'https://cinecenter.nl/film/cine-expat-woman/?special=expat',
  // url: 'https://cinecenter.nl/film/cine-expat-system-crasher/?special=expat',
  //   })
}

export default extractFromMainPage

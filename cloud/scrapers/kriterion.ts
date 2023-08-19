import Xray from 'x-ray'
import { DateTime } from 'luxon'

import { Screening } from '../types'
import { logger as parentLogger } from '../powertools'

const logger = parentLogger.createChild({
  persistentLogAttributes: {
    scraper: 'kriterion',
  },
})

const xray = Xray({
  filters: {
    trim: (value) => (typeof value === 'string' ? value.trim() : value),
    cleanTitle: (value) =>
      typeof value === 'string'
        ? value.replace(/ ENG SUBS$/, '').replace(' (ENG SUBS)', '')
        : value,
  },
})
  .concurrency(10)
  .throttle(10, 300)
  .timeout('5s')

const hasEnglishSubtitles = ({ metadata }: XRayFromMoviePage) => {
  const hasEnglishSubtitles =
    metadata.includes('Ondertiteling Engels') ||
    metadata.includes('Ondertiteling English')
  logger.info('hasEnglishSubtitles', { hasEnglishSubtitles, metadata })
  return hasEnglishSubtitles
}

type XRayFromMoviePage = {
  metadata: string[]
  sidebar: {
    title: string
    url: string
    date: string
  }[]
}

const extractFromMoviePage = async (url: string): Promise<Screening[]> => {
  logger.info('extracting', { url })

  const movie: XRayFromMoviePage = await xray(url, 'body', {
    metadata: ['#filmposter p'], // iterate to get "Ondertiteling Engels"
    sidebar: xray('li[typeof="schema:TheaterEvent"]', [
      {
        title: '[property="schema:name"] | trim | cleanTitle',
        url: 'span[property="schema:url"] | trim', // as the <a> has a ?start_date appended
        date: '[property="schema:startDate"]@datetime',
      },
    ]),
  })

  logger.info('extracted xray', { url, movie })

  if (!hasEnglishSubtitles(movie)) return []

  const screenings = movie.sidebar
    .filter((x) => x.url === url) // only look at the sidebar items that are about the current movie
    .map(({ date, ...rest }) => ({
      ...rest,
      cinema: 'Kriterion',
      date: DateTime.fromISO(date).toJSDate(),
    }))

  logger.info('extracted', { url, screenings })

  return screenings
}

type XRayFromMainPage = {
  title: string
  url: string
  date: string
}

// for now we only scrape movies that can be bought, so unfortunately not the ones
// a little more in the future (this will be harder to scrape as we need to parse the metadata which looks
// only semi structured, thus fragile. So now scraping of the main content '.highlightbox h4' but only
// the sidebar, and using the sidebar in extractFromMoviePage again so we only make one request for every
// movie, but still can easily get all the screenings
const extractFromMainPage = async () => {
  const xrayResult: XRayFromMainPage[] = await xray(
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

  logger.info('main page before', { xrayResult })

  const uniqueUrls = Array.from(new Set(xrayResult.map((x) => x.url)))

  logger.info('main page after uniq', { uniqueUrls })

  const screenings = await Promise.all(uniqueUrls.map(extractFromMoviePage))
  logger.info('before flatten', { screenings })

  return screenings.flat()
}

if (require.main === module) {
  extractFromMainPage()
    .then((x) => JSON.stringify(x, null, 2))
    .then(console.log)

  // extractFromMoviePage({
  //   url: 'https://kriterion.nl/films/dogman',
  // }).then(console.log)
}

export default extractFromMainPage

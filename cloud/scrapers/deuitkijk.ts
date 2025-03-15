import { Agent } from 'https'
import { DateTime } from 'luxon'
import request from 'request'
import Xray from 'x-ray'
import XRayCrawler from 'x-ray-crawler'

import { logger as parentLogger } from '../powertools'
import { Screening } from '../types'
import { titleCase } from './utils/titleCase'

const logger = parentLogger.createChild({
  persistentLogAttributes: {
    scraper: 'deuitkijk',
  },
})

// De Uitkijk has a certificate for which the intermediate certificate is not included in the default Node.js certificate store.
// Using a XRay driver with a custom agent that ignores certificate errors feels like a reasonable workaround, and definitely
// better than setting NODE_TLS_REJECT_UNAUTHORIZED=0 for all scrapers.
const agent = new Agent({ rejectUnauthorized: false })

const driver: XRayCrawler.Driver = (context, callback) => {
  const { url } = context

  request({ url, agent }, (err, response, body) => {
    return callback(err, body)
  })
}

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
  .driver(driver)

const hasEnglishSubtitles = ({ metadata }: { metadata: string[] }) =>
  metadata.some((x) => x.match(/ondertiteling:\s*engels/i))

// 31-10-22-16:30
const extractDate = (time: string) =>
  DateTime.fromFormat(time, 'dd-MM-yy-HH:mm').toJSDate()

const cleanTitle = (title: string) =>
  titleCase(
    title
      .replace(/ \(.*?\)$/g, '')
      .replace(/^110 Jaar De Uitkijk:/i, '')
      .replace(/^Klassieker:/i, '')
      .trim(),
  )

type XRayFromMoviePage = {
  title: string
  metadata: string[]
  screenings: string[]
}

export const extractFromMoviePage = async (
  url: string,
): Promise<Screening[]> => {
  logger.info('extracting', { url })

  const movie: XRayFromMoviePage = await xray(url, {
    title: 'h1.title',
    metadata: ['.film-details li | normalizeWhitespace | trim'],
    screenings: ['.film-tickets a@data-date'],
  })

  logger.info('extracted xray', { url, movie })

  if (!hasEnglishSubtitles(movie)) return []

  const screenings: Screening[] = movie.screenings.map((screening) => {
    return {
      title: cleanTitle(movie.title),
      url,
      cinema: 'De Uitkijk',
      date: extractDate(screening),
    }
  })

  logger.info('extracting done', { url, screenings })

  return screenings
}

type XRayFromMainPage = {
  url: string
  title: string
}

const extractFromMainPage = async () => {
  logger.info('extracting main page')

  const xrayResult: XRayFromMainPage[] = await xray(
    'https://uitkijk.nl/',
    '.movie-grid li',
    [
      {
        url: '> a@href',
        title: 'span',
      },
    ],
  )

  const uniqueUrls = Array.from(new Set(xrayResult.map((x) => x.url)))

  logger.info('main page', { uniqueUrls })

  const screenings = await Promise.all(uniqueUrls.map(extractFromMoviePage))

  logger.info('before flatten', { screenings })

  return screenings.flat()
}

export default extractFromMainPage

if (import.meta.url === new URL(import.meta.url).href) {
  // const url = 'https://uitkijk.nl/film/asian-movie-night-cat-got-your-tongue'
  // extractFromMoviePage(url).then((screenings) => {
  //   console.log({ screenings })
  // })
  extractFromMainPage()
    .then((x) => JSON.stringify(x, null, 2))
    .then(console.log)
}

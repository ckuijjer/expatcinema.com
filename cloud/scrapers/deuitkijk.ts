import got from 'got'
import { DateTime } from 'luxon'
import Xray from 'x-ray'
import XRayCrawler from 'x-ray-crawler'

import { logger as parentLogger } from '../powertools'
import { Screening } from '../types'
import { extractYearFromTitle } from './utils/extractYearFromTitle'
import { runIfMain } from './utils/runIfMain'
import { titleCase } from './utils/titleCase'
import { trim } from './utils/xrayFilters'

const logger = parentLogger.createChild({
  persistentLogAttributes: {
    scraper: 'deuitkijk',
  },
})

// De Uitkijk has a certificate for which the intermediate certificate is not included in the default Node.js certificate store.
// Using a custom got driver that ignores certificate errors feels like a reasonable workaround, and definitely
// better than setting NODE_TLS_REJECT_UNAUTHORIZED=0 for all scrapers.
const driver: XRayCrawler.Driver = (context, callback) => {
  const { url } = context

  got(String(url), { https: { rejectUnauthorized: false } })
    .then((response) => callback(null, response.body as never))
    .catch((err) => callback(err, null as never))
}

const xray = Xray({
  filters: {
    trim,
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

const parseReleaseYear = (metadata: string[]) => {
  const jaarField = metadata.find((entry) => /^jaar:/i.test(entry))
  const match = jaarField?.match(/\b((?:19|20)\d{2})\b/)

  return match?.[1] ? Number(match[1]) : undefined
}

// 31-10-22-16:30
const extractDate = (time: string) =>
  DateTime.fromFormat(time, 'dd-MM-yy-HH:mm').toJSDate()

const cleanTitle = (title: string) =>
  titleCase(
    title
      .replace(/^110 Jaar De Uitkijk:/i, '') // Remove the anniversary programme prefix
      .replace(/^Klassieker:/i, '') // Remove the classics programme prefix
      .replace(/^Tapis Rouge Classiques X De Uitkijk:/i, '') // Remove the Tapis Rouge collaboration prefix
      .replace(/^Deutsches Kino:/i, '') // Remove the Deutsches Kino programme prefix
      .replace(/^Drift X De Uitkijk:/i, '') // Remove the Drift collaboration prefix
      .replace(/^Film070 Presents:/i, '') // Remove the Film070 guest-programme prefix
      .replace(/^Fight the Power:/i, '') // Remove the Fight the Power programme prefix
      .replace(/\s+incl\.\s+introduction$/i, '') // Remove trailing introduction labels
      .replace(/(?:\s*\([^)]*\))+$/g, '') // Remove one or more trailing parenthetical labels like years or subtitle markers
      .replace(/\s*\|\s*Tapis Rouge Classiques X De Uitkijk$/i, '') // Remove the trailing Tapis Rouge collaboration suffix
      .replace(/\s*\|.*$/, '')
      .replace(/ \(.*?\)/g, '')
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
      year: parseReleaseYear(movie.metadata) ?? extractYearFromTitle(movie.title),
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

runIfMain(extractFromMainPage, import.meta.url)

export default extractFromMainPage

import got from 'got'
import { DateTime } from 'luxon'
import Xray from 'x-ray'

import { logger as parentLogger } from '../powertools'
import { Screening } from '../types'
import { makeScreeningsUniqueAndSorted } from './utils/makeScreeningsUniqueAndSorted'
import { runIfMain } from './utils/runIfMain'
import { trim } from './utils/xrayFilters'

const logger = parentLogger.createChild({
  persistentLogAttributes: {
    scraper: 'fchyena',
  },
})

const BASE_URL = 'https://fchyena.nl'
const TICKETS_BASE_URL = 'https://tickets.fchyena.nl'

const xray = Xray({
  filters: {
    trim,
    normalizeWhitespace: (value) =>
      typeof value === 'string' ? value.replace(/\s+/g, ' ') : value,
  },
})
  .concurrency(10)
  .throttle(10, 300)

type MainPageResult = {
  title: string
  url: string
  productionId: string
}

type DetailPageResult = {
  credits: string[]
}

type TicketPageResult = {
  date: string
}

const hasEnglishSubtitles = ({ credits }: DetailPageResult) => {
  const normalizedCredits = (credits ?? []).join(' ').toLowerCase()

  return (
    normalizedCredits.includes('english subs') ||
    normalizedCredits.includes('engels ondertiteld') ||
    normalizedCredits.includes('engels gesproken, engels ondertiteld')
  )
}

const parseScreeningDate = (date: string) => {
  const parsed = DateTime.fromFormat(date, 'ccc d LLLL yyyy, HH:mm', {
    locale: 'nl',
    zone: 'Europe/Amsterdam',
  })

  if (!parsed.isValid) {
    throw new Error(`Could not parse FC Hyena screening date: ${date}`)
  }

  return parsed.toJSDate()
}

const extractFromTicketPage = async ({
  title,
  url,
  productionId,
}: MainPageResult): Promise<Screening[]> => {
  if (!productionId || productionId === '0') {
    return []
  }

  const html = await got(
    `${TICKETS_BASE_URL}/fchyena/nl/flow_configs/1/z_events_list`,
    {
      searchParams: {
        production_id: productionId,
      },
    },
  ).text()

  const screenings: TicketPageResult[] = await xray(html, 'table tbody tr', [
    {
      date: 'p | normalizeWhitespace | trim',
    },
  ])

  logger.info('ticket page', { title, productionId, screenings })

  return screenings.map(({ date }) => ({
    title,
    url,
    cinema: 'FC Hyena',
    date: parseScreeningDate(date),
  }))
}

const extractFromMoviePage = async (
  movie: MainPageResult,
): Promise<Screening[]> => {
  const detailPage: DetailPageResult = await xray(movie.url, {
    credits: ['.film-detail__credits div | normalizeWhitespace | trim'],
  })

  logger.info('detail page', { movie, detailPage })

  if (!hasEnglishSubtitles(detailPage)) {
    return []
  }

  return extractFromTicketPage(movie)
}

const extractFromMainPage = async (): Promise<Screening[]> => {
  const html = await got(`${BASE_URL}/agenda/`).text()

  const results: MainPageResult[] = await xray(
    html,
    'li.film--poster[data-productionid]',
    [
      {
        title: 'h2.film-info__title | normalizeWhitespace | trim',
        url: '.film-info a.time.time--inverted[href*="/films/"]@href',
        productionId: '@data-productionid',
      },
    ],
  )

  logger.info('main page', { results })

  const screenings = (
    await Promise.all(
      results.map(({ title, url, productionId }) =>
        extractFromMoviePage({
          title,
          url: new URL(url, BASE_URL).toString(),
          productionId,
        }),
      ),
    )
  ).flat()

  return makeScreeningsUniqueAndSorted(screenings)
}

runIfMain(extractFromMainPage, import.meta.url)

export default extractFromMainPage

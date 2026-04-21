import { DateTime } from 'luxon'
import Xray from 'x-ray'

import { logger as parentLogger } from '../powertools'
import { runIfMain } from './utils/runIfMain'
import { titleCase } from './utils/titleCase'
import { trim } from './utils/xrayFilters'

const logger = parentLogger.createChild({
  persistentLogAttributes: {
    scraper: 'liff',
  },
})

const xray = Xray({
  filters: {
    trim,
  },
})
  .concurrency(10)
  .throttle(10, 300)

type LiffMovie = {
  title: string
  url: string
  metadata: string[]
  firstScreening: {
    date: string
    time: string
  }
  restScreenings: {
    date: string
    time: string
  }[]
}

type LiffListing = {
  title: string
  url: string
}

const hasEnglishSubtitles = (movie: Pick<LiffMovie, 'metadata'>) =>
  movie.metadata.some((x) => x === 'SubtitlesEnglish')

const cleanTitle = (title: string) => titleCase(title)

const extractFromMoviePage = ({
  url,
}: LiffListing): Promise<
  { title: string; url: string; date: string; cinema: string }[]
> => {
  logger.info('extracting', { url })

  return xray(url, 'body', {
    title: '.film-title span | trim',
    metadata: ['.bg-yellow p'],
    firstScreening: xray('.padding-box', {
      date: 'h3',
      time: 'span.prog-date',
    }),
    restScreenings: xray('.data-stroke .data-stroke-item', [
      {
        date: '.h3',
        time: '.h4',
      },
    ]),
  }).then((movie: LiffMovie) => {
    if (!hasEnglishSubtitles(movie)) return []

    const format = 'cccc d MMMM H:mm'

    const date = movie.firstScreening.date
    const time = movie.firstScreening.time.match(/[\d:]*/)?.[0]
    if (!time) {
      throw new Error(`Could not parse screening time for ${url}`)
    }

    const firstScreening = DateTime.fromFormat(`${date} ${time}`, format)
      .toUTC()
      .toISO()
    if (!firstScreening) {
      throw new Error(`Could not parse screening date for ${url}`)
    }

    const screenings = [
      firstScreening,
      ...movie.restScreenings.map((screening) => {
        const time = screening.time.match(/[\d:]*/)?.[0]
        if (!time) {
          throw new Error(`Could not parse screening time for ${url}`)
        }

        const dayIndex = screening.date.match(/\d+/)?.index
        if (dayIndex === undefined) {
          throw new Error(`Could not parse screening date for ${url}`)
        }
        const date = [
          screening.date.slice(0, dayIndex),
          screening.date.slice(dayIndex),
        ].join(' ')

        const parsed = DateTime.fromFormat(`${date} ${time}`, format)
          .toUTC()
          .toISO()
        if (!parsed) {
          throw new Error(`Could not parse screening date for ${url}`)
        }

        return parsed
      }),
    ]

    return screenings.map((screening) => ({
      title: cleanTitle(movie.title),
      url,
      date: screening,
      cinema: 'LIFF - Multiple locations',
    }))
  })
}

const extractFromMainPage = () => {
  return xray('https://www.liff.nl/en/Program/Program-A-Z', '.program-block', [
    {
      url: 'a@href',
      title: 'a',
    },
  ])
    .then((results: LiffListing[]) =>
      Promise.all(results.map(extractFromMoviePage)),
    )
    .then((results) => results.flat())
}

runIfMain(extractFromMainPage, import.meta.url)

export default extractFromMainPage

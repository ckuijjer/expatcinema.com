import got from 'got'
import { DateTime } from 'luxon'
import Xray from 'x-ray'

import { logger as parentLogger } from '../powertools'
import { Screening } from '../types'
import { extractYearFromTitle } from './utils/extractYearFromTitle'
import { guessYear } from './utils/guessYear'
import { makeScreeningsUniqueAndSorted } from './utils/makeScreeningsUniqueAndSorted'
import { removeYearSuffix } from './utils/removeYearSuffix'
import { runIfMain } from './utils/runIfMain'
import { shortMonthToNumberDutch } from './utils/monthToNumber'
import { titleCase } from './utils/titleCase'
import { trim } from './utils/xrayFilters'

const logger = parentLogger.createChild({
  persistentLogAttributes: {
    scraper: 'filmtheaterhilversum',
  },
})

const PROGRAMME_URL =
  'https://filmtheaterhilversum.nl/wp-content/plugins/raadhuis-filmtheater/controllers/filter.php?day=full'

const xray = Xray({
  filters: {
    trim,
    normalizeWhitespace: (value) =>
      typeof value === 'string' ? value.replace(/\s+/g, ' ') : value,
  },
})
  .concurrency(10)
  .throttle(10, 300)

type ProgrammeMovie = {
  title: string
  url: string
  screenings: {
    date: string
    times: string[]
  }[]
}

type DetailPageResult = {
  metadata: {
    label: string
    value: string
  }[]
}

const cleanTitle = (title: string) =>
  titleCase(
    removeYearSuffix(title)
      .replace(/\s+\|\s+(?:met .*|laatste kans|voorpremi[eè]re)$/i, '')
      .replace(/\s+-\s+Laatste kans$/i, ''),
  )

const extractTime = (time: string) => {
  const matchedTime = time.match(/\b\d{1,2}:\d{2}\b/)?.[0]

  if (!matchedTime) {
    throw new Error(
      `Could not parse Filmtheater Hilversum screening time: ${time}`,
    )
  }

  return matchedTime
}

const parseScreeningDate = (dateLabel: string, time: string) => {
  const trimmedDate = dateLabel.trim()
  const trimmedTime = time.trim()

  let day: number
  let month: number
  let year: number

  if (trimmedDate === 'Vandaag') {
    ;({ day, month, year } = DateTime.now())
  } else if (trimmedDate === 'Morgen') {
    ;({ day, month, year } = DateTime.now().plus({ days: 1 }))
  } else {
    const [, dayString, monthString] = trimmedDate.split(/\s+/)
    day = Number(dayString)
    month = shortMonthToNumberDutch(monthString)
    year = guessYear({ day, month, year: DateTime.now().year })
  }

  const [hourString, minuteString] = extractTime(trimmedTime).split(':')
  const parsed = DateTime.fromObject(
    {
      year,
      month,
      day,
      hour: Number(hourString),
      minute: Number(minuteString),
    },
    {
      zone: 'Europe/Amsterdam',
    },
  )

  if (!parsed.isValid) {
    throw new Error(
      `Could not parse Filmtheater Hilversum screening date: ${dateLabel} ${time}`,
    )
  }

  return parsed.toJSDate()
}

const hasEnglishSubtitles = ({ metadata }: DetailPageResult) => {
  const metadataMap = Object.fromEntries(
    metadata.map(({ label, value }) => [label, value]),
  )

  const subtitles = metadataMap['Ondertiteling']?.toLowerCase() ?? ''

  return subtitles.includes('engels') || subtitles.includes('english')
}

const parseReleaseYear = ({ metadata }: DetailPageResult) => {
  const metadataMap = Object.fromEntries(
    metadata.map(({ label, value }) => [label, value]),
  )

  const year = Number(metadataMap['Jaar'])

  return Number.isInteger(year) ? year : undefined
}

const extractFromMoviePage = async ({
  title,
  url,
  screenings,
}: ProgrammeMovie): Promise<Screening[]> => {
  const detailPage: DetailPageResult = await xray(url, {
    metadata: xray('.movie-info-row', [
      {
        label: 'div:first-child | normalizeWhitespace | trim',
        value: 'div:last-child | normalizeWhitespace | trim',
      },
    ]),
  })

  logger.info('movie page', { title, url, detailPage })

  if (!hasEnglishSubtitles(detailPage)) {
    return []
  }

  return screenings.flatMap(({ date, times }) =>
    (times ?? []).map((time) => ({
      title: cleanTitle(title),
      year: parseReleaseYear(detailPage) ?? extractYearFromTitle(title),
      url,
      cinema: 'Filmtheater Hilversum',
      date: parseScreeningDate(date, time),
    })),
  )
}

const extractFromMainPage = async (): Promise<Screening[]> => {
  const html = await got(PROGRAMME_URL).text()

  const movies: ProgrammeMovie[] = await xray(html, '.moviecard', [
    {
      title: 'a.movie-title h2 | normalizeWhitespace | trim',
      url: 'a.movie-title@href',
      screenings: xray('.row > .large-4 .movie-times .movie-time', [
        {
          date: 'p.movie-screenday | normalizeWhitespace | trim',
          times: ['a.movie-timeblock | normalizeWhitespace | trim'],
        },
      ]),
    },
  ])

  logger.info('main page', { movies })

  const screenings = (
    await Promise.all(
      movies
        .filter(({ title, url }) => title && url)
        .map((movie) => extractFromMoviePage(movie)),
    )
  ).flat()

  return makeScreeningsUniqueAndSorted(screenings)
}

runIfMain(extractFromMainPage, import.meta.url)

export default extractFromMainPage

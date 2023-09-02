// TODO: totally copy pasted from springhaver. That has to be better

import Xray from 'x-ray'
import { DateTime } from 'luxon'
import got from 'got'

import splitTime from './splitTime'
import { fullMonthToNumberDutch } from './monthToNumber'
import guessYear from './guessYear'
import { Screening } from '../types'
import { logger as parentLogger } from '../powertools'

const logger = parentLogger.createChild({
  persistentLogAttributes: {
    scraper: 'hartlooper',
  },
})

const xray = Xray({
  filters: {
    trim: (value) => (typeof value === 'string' ? value.trim() : value),
    toLowerCase: (value) =>
      typeof value === 'string' ? value.toLowerCase() : value,
  },
})
  .concurrency(10)
  .throttle(10, 300)

const metadataDescribedEnglishSubtitles = (metadata: {
  [key: string]: string
}) => {
  const subtitles = metadata['ondertitelde taal']

  return subtitles === 'english' || subtitles === 'engels'
}

const cleanTitle = (title: string) =>
  title
    .replace(/Language No Problem: /i, '')
    .replace(/ \(English Subtitles\)/i, '')
    .replace(/ \(with English subtitles\)/i, '')
    .replace(/^.*?: /, '')
    .replace(/ \(\d{4}\).*?$/, '')

type XRayFromMoviePage = {
  title: string
  screenings: {
    date: {
      day: string
      month: string
    }
    times: string[]
  }[]
  metadata: {
    key: string
    value: string
  }[]
}

const extractFromMoviePage = async ({ url }: { url: string }) => {
  logger.info('extracting', { url })

  const movie: XRayFromMoviePage = await xray(url, 'body', {
    title: '.intro-content h1 | trim',
    screenings: xray('.play-times td', [
      {
        date: xray('a', {
          day: '.day | trim',
          month: '.month | trim',
        }),
        times: ['.time span | trim'],
      },
    ]),
    metadata: xray('.movie-info tr', [
      {
        key: 'td:nth-child(1) | toLowerCase | trim',
        value: 'td:nth-child(2) | toLowerCase | trim',
      },
    ]),
  })

  logger.info('extracted xray', { url, movie })

  const metadata = movie.metadata.reduce(
    (acc, { key, value }) => ({ ...acc, [key]: value }),
    {} as { [key: string]: string },
  )

  logger.info('metadata', { metadata })

  if (!metadataDescribedEnglishSubtitles(metadata)) return []

  const screenings = movie.screenings
    .map(({ date, times }) =>
      times.map((time) => {
        const day = +date.day
        const month = fullMonthToNumberDutch(date.month)
        const [hour, minute] = splitTime(time)

        const year = guessYear(
          DateTime.fromObject({
            day,
            month,
            hour,
            minute,
          }),
        )

        return {
          title: cleanTitle(movie.title),
          url,
          cinema: 'Louis Hartlooper Complex',
          date: DateTime.fromObject({
            day,
            month,
            hour,
            minute,
            year,
          }).toJSDate(),
        }
      }),
    )
    .flat()

  logger.info('extracting done', { url, screenings })

  return screenings
}

const extractFromMainPage = async (): Promise<Screening[]> => {
  const movies: { post_title: string; link: string }[] = await got(
    'https://www.hartlooper.nl/wp-admin/admin-ajax.php?action=get_movies&day=movies',
  ).json()

  const formattedMovies = movies.map(({ post_title, link }) => ({
    title: post_title,
    url: link,
  }))

  logger.info('main page', { formattedMovies })

  const screenings: Screening[] = (
    await Promise.all(formattedMovies.map(extractFromMoviePage))
  ).flat()

  logger.info('before flatten', { screenings })

  return screenings.flat()
}

if (require.main === module) {
  extractFromMainPage()
    .then((x) => JSON.stringify(x, null, 2))
    .then(console.log)

  // extractFromMoviePage({
  //   url: 'https://www.springhaver.nl/films/language-no-problem-roter-himmel-english-subtitles/',
  // })
}

export default extractFromMainPage

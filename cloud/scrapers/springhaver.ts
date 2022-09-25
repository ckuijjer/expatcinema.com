import Xray from 'x-ray'
import { DateTime } from 'luxon'
import got from 'got'

import splitTime from './splitTime'
import { fullMonthToNumber } from './monthToNumber'
import guessYear from './guessYear'
import { Screening } from '../types'
import { logger as parentLogger } from '../powertools'

const logger = parentLogger.createChild({
  persistentLogAttributes: {
    scraper: 'springhaver',
  },
})

const xray = Xray({
  filters: {
    trim: (value) => (typeof value === 'string' ? value.trim() : value),
  },
})
  .concurrency(10)
  .throttle(10, 300)

const hasEnglishSubtitles = ({ title }: { title: string }) =>
  title.toLowerCase().includes('language no problem') ||
  title.toLowerCase().includes('(english subtitles)')

const cleanTitle = (title: string) =>
  title
    .replace(/Language No Problem: /i, '')
    .replace(/ \(English Subtitles\)/i, '')
    .replace(/^Cine De Vuelta: /i, '')
    .replace(/ \(\d{4}\).*?$/, '')

type XRayFromMoviePage = {
  title: string
  screenings: {
    date: {
      day: number
      month: number
    }
    times: string[]
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
  })

  logger.info('extracted xray', { url, movie })

  if (!hasEnglishSubtitles(movie)) return []

  const screenings = movie.screenings
    .map(({ date, times }) =>
      times.map((time) => {
        const day = +date.day
        const month = fullMonthToNumber(date.month)
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
          cinema: 'Springhaver',
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
    'https://www.springhaver.nl/wp-admin/admin-ajax.php?action=get_movies&day=movies',
  ).json()

  const formattedMovies = movies.map(({ post_title, link }) => ({
    title: post_title,
    url: link,
  }))

  logger.info('main page', { formattedMovies })

  const filteredMovies = formattedMovies.filter(hasEnglishSubtitles)

  logger.info('main page with english subtitles', { filteredMovies })

  const screenings: Screenings = await Promise.all(
    filteredMovies.map(extractFromMoviePage),
  )

  logger.info('before flatten', { screenings })

  return screenings.flat()
}

if (require.main === module) {
  extractFromMainPage()
    .then((x) => JSON.stringify(x, null, 2))
    .then(console.log)

  // extractFromMoviePage({
  //   url: 'https://www.springhaver.nl/movies/1458/17/blackkklansman',
  // })
}

export default extractFromMainPage

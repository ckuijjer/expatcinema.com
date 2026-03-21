import got from 'got'
import { DateTime } from 'luxon'

import { logger as parentLogger } from '../powertools'
import { Screening } from '../types'
import { runIfMain } from './utils/runIfMain'
import { titleCase } from './utils/titleCase'

const logger = parentLogger.createChild({
  persistentLogAttributes: {
    scraper: 'cinerama',
  },
})

type KinepolisProgrammation = {
  sessions: KinepolisSession[]
  films: KinepolisMovie[]
}

type KinepolisSession = {
  showtime: string
  film: {
    id: string
  }
  sessionSubtitles: {
    id: string
  }[]
}

type KinepolisMovie = {
  id: string
  corporateId: string
  title: string
  subtitles: {
    id: string
    name: string
    code: string
  }[]
}

const hasEnglishSubtitles = (movie: KinepolisMovie) => {
  return movie.subtitles?.some(
    (subtitle) => subtitle.code.toLowerCase() === 'engsubt',
  )
}

const cleanTitle = (title: string) => {
  return titleCase(title.replace(/^Special Event:\s+/i, ''))
}

const extractFromMainPage = async (): Promise<Screening[]> => {
  try {
    const url =
      'https://kinepolisweb-programmation.kinepolis.com/api/Programmation/NL/NL/WWW/Cinema/Cinerama'

    const programmation: KinepolisProgrammation = await got(url, {
      headers: {
        accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'accept-language': 'en-US,en;q=0.9',
        'sec-ch-ua': '"Chromium";v="143", "Not;A=Brand";v="8"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"macOS"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'cross-site',
        Referer: 'https://cineramabios.nl/',
        'user-agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36',
      },
    }).json()

    const moviesWithEnglishSubtitles =
      programmation.films.filter(hasEnglishSubtitles)

    logger.info('movies with english subtitles', { moviesWithEnglishSubtitles })

    const screenings: Screening[][] = moviesWithEnglishSubtitles.map((movie) =>
      programmation.sessions
        .filter((session) => session.film.id === movie.id)
        .map((session) => ({
          title: cleanTitle(movie.title),
          url: `https://cineramabios.nl/movies/detail/${movie.corporateId}/${movie.id}/`,
          cinema: 'Cinerama',
          date: DateTime.fromISO(session.showtime).toJSDate(),
        })),
    )

    logger.info('before flatten', { screenings })

    return screenings.flat()
  } catch (error) {
    logger.error('error scraping cinerama', { error })
    return []
  }
}

runIfMain(extractFromMainPage, import.meta.url)

export default extractFromMainPage

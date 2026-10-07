import got from 'got'
import { DateTime } from 'luxon'

import { relayJson, shouldRelay } from '../clients/scrapeRelay'
import { logger as parentLogger } from '../powertools'
import { Screening } from '../types'
import { extractYearFromTitle } from './utils/extractYearFromTitle'
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
  releaseDate?: string // e.g. '2026-10-20T00:00:00', the release in the Netherlands
  event?: {
    isActive: boolean
    name?: string // e.g. 'Klassieker'
    shortName?: string // e.g. 'Reprise'
  }
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

// The API only has the date a film is released in the Netherlands, not its
// production year. That is the year of a new film, but a classic or re-release
// has the date of the re-release: 'Akira (4K Restoration)' says 2026, the film
// is from 1988. A wrong year is worse than none, because it moves the match to
// another film (Akira, 2025), so those get no year, and a year in the title
// ('Pride (2014)') is the film's year.
const RE_RELEASE_EVENT = /klassieker|classic|reprise/i
const RE_RELEASE_TITLE = /restoration|remaster|anniversary|re-?release/i

export const extractYear = (movie: KinepolisMovie) => {
  const yearInTitle = extractYearFromTitle(movie.title)
  if (yearInTitle) {
    return yearInTitle
  }

  const isReRelease =
    RE_RELEASE_EVENT.test(
      `${movie.event?.name ?? ''} ${movie.event?.shortName ?? ''}`,
    ) || RE_RELEASE_TITLE.test(movie.title)
  if (isReRelease) {
    return undefined
  }

  const year = Number(movie.releaseDate?.slice(0, 4))

  return year >= 1888 && year <= DateTime.now().year + 2 ? year : undefined
}

const extractFromMainPage = async (): Promise<Screening[]> => {
  try {
    const url =
      'https://kinepolisweb-programmation.kinepolis.com/api/Programmation/NL/NL/WWW/Cinema/Cinerama'

    // Kinepolis blocks AWS, so on the Lambda this goes through the relay
    const headers = {
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
    }

    const programmation: KinepolisProgrammation = shouldRelay(url)
      ? await relayJson<KinepolisProgrammation>(url, headers)
      : await got(url, { headers }).json()

    const moviesWithEnglishSubtitles =
      programmation.films.filter(hasEnglishSubtitles)

    logger.debug('movies with english subtitles', {
      moviesWithEnglishSubtitles,
    })

    const screenings: Screening[][] = moviesWithEnglishSubtitles.map((movie) =>
      programmation.sessions
        .filter((session) => session.film.id === movie.id)
        .map((session) => ({
          title: cleanTitle(movie.title),
          year: extractYear(movie),
          url: `https://cineramabios.nl/movies/detail/${movie.corporateId}/${movie.id}/`,
          cinema: 'Cinerama',
          date: DateTime.fromISO(session.showtime).toJSDate(),
        })),
    )

    logger.debug('before flatten', { screenings })

    return screenings.flat()
  } catch (error) {
    logger.error('error scraping cinerama', { error })
    return []
  }
}

export default extractFromMainPage

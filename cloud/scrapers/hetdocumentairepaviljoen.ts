import { DateTime } from 'luxon'

import { logger as parentLogger } from '../powertools'
import { Screening } from '../types'
import { extractScreeningsFromPages } from './utils/extractScreeningsFromPages'
import { titleCase } from './utils/titleCase'
import { createXray } from '../xRay'

const logger = parentLogger.createChild({
  persistentLogAttributes: {
    scraper: 'hetdocumentairepaviljoen',
  },
})

const xray = createXray({ logger })

type CinemaFilmDetail = {
  id: string
  fullPreferredTitle: string
  yearOfProduction?: number | null
  shows: CinemaFilmDetailShow[]
}

type SearchCinemaScheduleShow = {
  id: string
  fullTitle: string
  film?: {
    id: string
    fullPreferredTitle: string
  } | null
}

type DehydratedState = {
  queries: Array<{
    queryKey: string[]
    state: {
      data: {
        film?: CinemaFilmDetail
        searchCinemaSchedule?: {
          hits: SearchCinemaScheduleShow[]
        }
      }
    }
  }>
}

type CinemaFilmDetailShow = {
  startOn: string
  endOn: string
  accessibility:
    | {
        translation: string
      }[]
    | null
}

// The film detail has "yearOfProduction": 1982 (Sans soleil). Not to be
// confused with "edition": { "year": 2023 }, the year of the festival edition.
export const parseYearOfProduction = (value?: number | string | null) => {
  const year = /^\d{4}$/.test(String(value ?? '')) ? Number(value) : undefined

  return year && year >= 1888 && year <= new Date().getFullYear() + 2
    ? year
    : undefined
}

const cleanTitle = (title: string) => titleCase(title)

const hasEnglishSubtitles = (show: CinemaFilmDetailShow) => {
  if (!show.accessibility) return false

  // e.g. "Film is Engels ondertiteld", "Subtitled in English"
  return show.accessibility.some(({ translation }) =>
    /engels ondertiteld|subtitled in english|english subtitles/i.test(
      translation ?? '',
    ),
  )
}

const isTodayOrLater = (show: CinemaFilmDetailShow) => {
  return DateTime.fromISO(show.startOn) >= DateTime.now().startOf('day')
}

const extractFromMoviePage = async (film: MainPageCinemaScheduleFilm) => {
  const { title, url, filmId } = film
  logger.debug('extractFromMoviePage', { title, url, filmId })

  const data = JSON.parse(await xray(url, '#__NEXT_DATA__')) as {
    props: {
      pageProps: {
        dehydratedState?: DehydratedState
      }
    }
  }

  const dehydratedState = data.props.pageProps.dehydratedState
  if (!dehydratedState) {
    logger.warn(
      `extractFromMoviePage: No dehydratedState: ${title} (${filmId} - ${url})`,
    )
    return []
  }

  // logger.debug('data', { data }) // uncomment to debug structure of __NEXT_DATA__

  const filmDetail = dehydratedState.queries.find(({ queryKey }) =>
    queryKey.includes('CinemaFilmDetail'),
  )?.state.data.film

  if (!filmDetail) {
    logger.warn(
      `extractFromMoviePage: No film detail: ${title} (${filmId} - ${url})`,
    )
    return []
  }

  const screenings: Screening[] = filmDetail.shows
    .filter(hasEnglishSubtitles)
    .filter(isTodayOrLater)
    .map((show) => {
      return {
        title,
        year: parseYearOfProduction(filmDetail.yearOfProduction),
        url,
        cinema: 'Het Documentaire Paviljoen',
        date: new Date(show.startOn),
      }
    })

  logger.debug('moviepage screenings', { url, screenings })

  return screenings
}

type MainPageCinemaScheduleFilm = {
  url: string
  title: string
  filmId: string
}

const getFilmUrl = (id: string) => `https://www.idfa.nl/en/cinema/${id}`

const extractFromMainPage = async () => {
  const url =
    'https://www.idfa.nl/en/vondelpark/agenda-het-documentaire-paviljoen/'

  // Use `copy(JSON.parse(document.querySelector('#__NEXT_DATA__').innerText))` to get an example of the data from Chrome DevTools
  const data = JSON.parse(await xray(url, '#__NEXT_DATA__')) as {
    props: {
      pageProps: {
        dehydratedState?: DehydratedState
      }
    }
  }

  const dehydratedState = data.props.pageProps.dehydratedState
  if (!dehydratedState) {
    logger.warn(`extractFromMainPage: No dehydratedState: ${url}`)
    return []
  }

  const shows =
    dehydratedState.queries.find(({ queryKey }) =>
      queryKey.includes('searchCinemaSchedule'),
    )?.state.data.searchCinemaSchedule?.hits ?? []

  const films: MainPageCinemaScheduleFilm[] = shows
    .map((show) => {
      if (!show.film) {
        logger.warn(
          `extractFromMainPage: No film in show: ${show.fullTitle} (${show.id})`,
        )
        return null
      }

      return {
        url: getFilmUrl(show.film.id),
        title: cleanTitle(show.film.fullPreferredTitle),
        filmId: show.film.id,
      }
    })
    .filter((x): x is MainPageCinemaScheduleFilm => Boolean(x))

  // Filter out duplicate films
  const uniqueFilms = films.filter(
    (film, index, self) =>
      index === self.findIndex((t) => t.filmId === film.filmId),
  )

  logger.debug('mainpage films', { uniqueFilms })

  // the __NEXT_DATA__ of the page doesn't contain subtitle information, so we need to filter it out
  const screenings = await extractScreeningsFromPages(
    uniqueFilms,
    extractFromMoviePage,
    { logger, url: ({ url }) => url },
  )

  logger.debug('screenings', { screenings })
  return screenings
}

export default extractFromMainPage

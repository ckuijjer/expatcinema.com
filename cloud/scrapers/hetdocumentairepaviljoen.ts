import { DateTime } from 'luxon'
import Xray from 'x-ray'

import { logger as parentLogger } from '../powertools'
import { Screening } from '../types'
import { titleCase } from './utils/titleCase'

const logger = parentLogger.createChild({
  persistentLogAttributes: {
    scraper: 'hetdocumentairepaviljoen',
  },
})

const xray = Xray().concurrency(10).throttle(10, 300)

type CinemaFilmDetail = {
  id: string
  fullPreferredTitle: string
  shows: CinemaFilmDetailShow[]
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

const cleanTitle = (title: string) => titleCase(title)

const hasEnglishSubtitles = (show: CinemaFilmDetailShow) => {
  if (!show.accessibility) return false

  return show.accessibility.some(
    ({ translation }) => translation === 'Subtitled in English',
  )
}

const isTodayOrLater = (show: CinemaFilmDetailShow) => {
  return DateTime.fromISO(show.startOn) >= DateTime.now().startOf('day')
}

const extractFromMoviePage = async (film: MainPageCinemaScheduleFilm) => {
  const { title, url, filmId } = film
  logger.info('extractFromMoviePage', { title, url, filmId })

  const data = JSON.parse(await xray(url, '#__NEXT_DATA__'))

  if (!data.props.pageProps.dehydratedState) {
    logger.warn(
      `extractFromMoviePage: No dehydratedState: ${title} (${filmId} - ${url})`,
    )
    return []
  }

  const filmDetail: CinemaFilmDetail =
    data.props.pageProps.dehydratedState.queries.find(({ queryKey }) =>
      queryKey.includes('CinemaFilmDetail'),
    )?.state.data.film

  const screenings: Screening[] = filmDetail.shows
    .filter(hasEnglishSubtitles)
    .filter(isTodayOrLater)
    .map((show) => {
      return {
        title,
        url,
        cinema: 'Het Documentaire Paviljoen',
        date: new Date(show.startOn),
      }
    })

  logger.info('moviepage screenings', { url, screenings })

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
  const data = JSON.parse(await xray(url, '#__NEXT_DATA__'))

  const shows = data.props.pageProps.dehydratedState.queries.find(
    ({ queryKey }) => queryKey.includes('searchCinemaSchedule'),
  )?.state.data.searchCinemaSchedule.hits

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
    .filter((x) => x)

  // Filter out duplicate films
  const uniqueFilms = films.filter(
    (film, index, self) =>
      index === self.findIndex((t) => t.filmId === film.filmId),
  )

  logger.info('mainpage films', { uniqueFilms })

  // the __NEXT_DATA__ of the page doesn't contain subtitle information, so we need to filter it out
  const screenings = await (
    await Promise.all(uniqueFilms.map(extractFromMoviePage))
  ).flat()

  logger.info('screenings', { screenings })
  return screenings
}

if (import.meta.url === new URL(import.meta.url).href) {
  //   extractFromMoviePage(
  // 	 //
  //   )
  //     .then((x) => JSON.stringify(x, null, 2))
  //     .then(console.log)

  extractFromMainPage()
    .then((x) => JSON.stringify(x, null, 2))
    .then(console.log)
}

export default extractFromMainPage

import type { Movie } from './getMovies'
import type { Screening } from './getScreenings'
import { removeDiacritics } from './removeDiacritics'

const normalize = (value: string) => removeDiacritics(value.toLowerCase())

type ScreeningSearchTarget = {
  title: string
  cinema: {
    name: string
    city: {
      name: string
    }
  }
}

export const matchesSearchComponents = (
  values: string[],
  searchComponents: string[],
) => {
  if (searchComponents.length === 0) {
    return true
  }

  const normalizedValues = values.map(normalize)

  return searchComponents.every((searchComponent) =>
    normalizedValues.some((value) => value.includes(searchComponent)),
  )
}

export const matchesScreeningSearch = <T extends ScreeningSearchTarget>(
  screening: T,
  searchComponents: string[],
) =>
  matchesSearchComponents(
    [screening.title, screening.cinema.name, screening.cinema.city.name],
    searchComponents,
  )

export const matchesMovieSearch = (movie: Movie, searchComponents: string[]) =>
  matchesSearchComponents(
    [movie.title, movie.sortTitle ?? movie.title],
    searchComponents,
  )

export const matchesUnmatchedMovieSearch = (
  screening: Screening,
  searchComponents: string[],
) =>
  matchesSearchComponents(
    [screening.title, screening.year?.toString() ?? ''],
    searchComponents,
  )

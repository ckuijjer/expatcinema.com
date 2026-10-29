import type { Movie } from './getMovies'
import { getMovieReleaseYear } from './getMovies'
import { normalizeSearchText } from './removeDiacritics'

type ScreeningSearchTarget = {
  title: string
  year?: number
  // the festival or series the screening belongs to, and what is special
  // about it: "ENFF", "nagesprek"
  event?: string
  notes?: string[]
  originalTitle?: string
  directors?: string[]
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

  const normalizedValues = values.map(normalizeSearchText)

  return searchComponents.every((searchComponent) =>
    normalizedValues.some((value) => value.includes(searchComponent)),
  )
}

export const matchesScreeningSearch = <T extends ScreeningSearchTarget>(
  screening: T,
  searchComponents: string[],
) =>
  matchesSearchComponents(
    [
      screening.title,
      screening.year?.toString() ?? '',
      screening.cinema.name,
      screening.cinema.city.name,
      screening.event ?? '',
      ...(screening.notes ?? []),
      screening.originalTitle ?? '',
      ...(screening.directors ?? []),
    ],
    searchComponents,
  )

export const matchesMovieSearch = (movie: Movie, searchComponents: string[]) =>
  matchesSearchComponents(
    [
      movie.title,
      getMovieReleaseYear(movie)?.toString() ?? '',
      movie.tmdb?.originalTitle ?? '',
      ...(movie.tmdb?.directors ?? []),
    ],
    searchComponents,
  )

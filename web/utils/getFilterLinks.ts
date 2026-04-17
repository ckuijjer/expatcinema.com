import cities from '../data/city.json'
import cinemas from '../data/cinema.json'
import type { FilterLink } from '../components/CityFilter'
import { Screening } from './getScreenings'

const compareAlphabetically = (left: string, right: string) =>
  left.localeCompare(right, undefined, { sensitivity: 'base' })

export const buildCityFilterLinks = (screenings: Screening[]): FilterLink[] => {
  const screeningCountByCity = screenings.reduce<Record<string, number>>(
    (counts, screening) => {
      counts[screening.cinema.city.slug] =
        (counts[screening.cinema.city.slug] ?? 0) + 1
      return counts
    },
    {},
  )

  return [
    { text: 'All', slug: null },
    ...cities
      .map(({ name, slug }) => ({
        text: name,
        slug,
        count: screeningCountByCity[slug] ?? 0,
      }))
      .sort(
        (left, right) =>
          right.count - left.count || left.text.localeCompare(right.text),
      )
      .map(({ text, slug }) => ({ text, slug })),
  ]
}

export const buildCinemaFilterLinks = (
  screenings: Screening[],
  city: string,
): FilterLink[] => {
  const screeningCountByCinema = screenings
    .filter((screening) => screening.cinema.city.slug === city)
    .reduce<Record<string, number>>((counts, screening) => {
      counts[screening.cinema.slug] = (counts[screening.cinema.slug] ?? 0) + 1
      return counts
    }, {})

  return [
    { text: 'All', slug: null },
    ...cinemas
      .filter((cinema) => cinema.city === city)
      .map(({ name, slug }) => ({
        text: name,
        slug,
        count: screeningCountByCinema[slug] ?? 0,
      }))
      .sort(
        (left, right) =>
          right.count - left.count ||
          compareAlphabetically(left.text, right.text),
      )
      .map(({ text, slug }) => ({ text, slug })),
  ]
}

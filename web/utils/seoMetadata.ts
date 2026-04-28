import type { Screening } from './getScreenings'

export const defaultDescription =
  'Find foreign-language movie screenings with English subtitles at cinemas across the Netherlands.'

const descriptionMaxLength = 155

export const truncateDescription = (description: string) => {
  const normalized = description.replace(/\s+/g, ' ').trim()

  if (normalized.length <= descriptionMaxLength) {
    return normalized
  }

  const truncated = normalized.slice(0, descriptionMaxLength - 1)
  const lastSpaceIndex = truncated.lastIndexOf(' ')

  return `${truncated.slice(0, lastSpaceIndex > 0 ? lastSpaceIndex : undefined)}...`
}

export const formatList = (items: string[]) => {
  const uniqueItems = Array.from(new Set(items)).filter(Boolean)

  if (uniqueItems.length <= 1) {
    return uniqueItems[0] ?? ''
  }

  if (uniqueItems.length === 2) {
    return `${uniqueItems[0]} and ${uniqueItems[1]}`
  }

  return `${uniqueItems.slice(0, -1).join(', ')}, and ${
    uniqueItems[uniqueItems.length - 1]
  }`
}

export const getScreeningCinemaNames = (screenings: Screening[], limit = 4) =>
  Array.from(
    new Set(screenings.map((screening) => screening.cinema.name)),
  ).slice(0, limit)

export const getScreeningCityNames = (screenings: Screening[], limit = 4) =>
  Array.from(
    new Set(screenings.map((screening) => screening.cinema.city.name)),
  ).slice(0, limit)

export const buildCityDescription = (
  cityName: string,
  screenings: Screening[],
) => {
  const cinemaNames = getScreeningCinemaNames(screenings)
  const cinemaLabel = formatList(cinemaNames)

  return truncateDescription(
    cinemaLabel
      ? `Find English-subtitled movie screenings in ${cityName}, including films at ${cinemaLabel}.`
      : `Find English-subtitled movie screenings in ${cityName}.`,
  )
}

export const buildCinemaDescription = (cinemaName: string, cityName: string) =>
  truncateDescription(
    `Find English-subtitled movie screenings at ${cinemaName} in ${cityName}, with dates, times, and booking links.`,
  )

export const buildMovieDescription = (
  movieTitle: string,
  overview: string | undefined,
  screenings: Screening[],
  locationLabel: string | null,
) => {
  const cityNames = getScreeningCityNames(screenings, 3)
  const cityLabel = formatList(cityNames)
  const availability = locationLabel
    ? `English-subtitled screenings in ${locationLabel}.`
    : cityLabel
      ? `English-subtitled screenings in ${cityLabel}.`
      : 'English-subtitled screenings in the Netherlands.'

  return truncateDescription(
    overview ? `${overview} ${availability}` : `${movieTitle}: ${availability}`,
  )
}

import type { Screening } from './getScreenings'

export const defaultDescription =
  'Discover international films with English subtitles playing at cinemas across the Netherlands. Browse showtimes, venues and upcoming screenings.'

const DESCRIPTION_MAXIMUM_LENGTH = 155

const normalizeDescription = (description: string) =>
  description.replace(/\s+/g, ' ').trim()

const truncateDescriptionToLength = (
  description: string,
  maximumLength: number,
) => {
  const normalized = normalizeDescription(description)

  if (normalized.length <= maximumLength) {
    return normalized
  }

  const truncated = normalized.slice(0, maximumLength - 3)
  const lastSpaceIndex = truncated.lastIndexOf(' ')

  return `${truncated.slice(0, lastSpaceIndex > 0 ? lastSpaceIndex : undefined)}...`
}

export const truncateDescription = (description: string) =>
  truncateDescriptionToLength(description, DESCRIPTION_MAXIMUM_LENGTH)

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
      ? `Discover international films with English subtitles playing at ${cinemaLabel} in ${cityName}.`
      : `Discover international films with English subtitles playing in ${cityName}.`,
  )
}

export const buildCinemaDescription = (cinemaName: string, cityName: string) =>
  truncateDescription(
    `Discover international films with English subtitles playing at ${cinemaName} in ${cityName}.`,
  )

export const buildMovieDescription = (
  movieTitle: string,
  overview: string | undefined,
  screenings: Screening[],
  locationLabel: string | null,
) => {
  void overview

  const cityNames = getScreeningCityNames(screenings, 3)
  const cityLabel = formatList(cityNames)
  const location = locationLabel ?? cityLabel ?? 'the Netherlands'
  const showtimesLabel = locationLabel?.includes(',')
    ? 'Find showtimes.'
    : 'Find showtimes and cinemas.'
  const titleWithoutYear = movieTitle.replace(/\s+\(\d{4}\)$/, '')
  const descriptions = [
    `Watch ${movieTitle} with English subtitles in ${location}. ${showtimesLabel}`,
    `Watch ${titleWithoutYear} with English subtitles in ${location}. ${showtimesLabel}`,
    `${titleWithoutYear}: English-subtitled screenings in ${location}. ${showtimesLabel}`,
  ]
  const description = descriptions.find(
    (candidate) => candidate.length <= DESCRIPTION_MAXIMUM_LENGTH,
  )

  return (
    description ?? truncateDescription(descriptions[descriptions.length - 1])
  )
}

export const getMovieDescription = (movieTitle: string, overview?: string) =>
  truncateDescription(overview ? overview : movieTitle)

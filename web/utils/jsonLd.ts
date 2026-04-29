import { getMoviePagePath } from './getMoviePagePath'
import { getMoviePosterUrl, getMovieReleaseYear, type Movie } from './getMovies'
import type { Screening } from './getScreenings'
import { getCanonicalUrl, siteUrl } from './siteUrl'

type JsonLdValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | JsonLdValue[]
  | { [key: string]: JsonLdValue }

const compactJsonLd = (value: JsonLdValue): JsonLdValue => {
  if (Array.isArray(value)) {
    return value
      .map(compactJsonLd)
      .filter((item) => item !== undefined && item !== null)
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .map(([key, item]) => [key, compactJsonLd(item)] as const)
        .filter(([, item]) => {
          if (item === undefined || item === null) {
            return false
          }

          return !(Array.isArray(item) && item.length === 0)
        }),
    )
  }

  return value
}

export const serializeJsonLd = (value: JsonLdValue) =>
  JSON.stringify(compactJsonLd(value)).replace(/</g, '\\u003c')

export const buildMovieJsonLd = (
  movie: Movie,
  movieSlug: string,
  description?: string,
) => {
  const canonicalUrl = getCanonicalUrl(getMoviePagePath(movieSlug))
  const posterUrl = getMoviePosterUrl(movie.tmdb?.posterPath, 'w342')
  const year = getMovieReleaseYear(movie)

  return compactJsonLd({
    '@context': 'https://schema.org',
    '@type': 'Movie',
    '@id': `${canonicalUrl}#movie`,
    name: movie.title,
    url: canonicalUrl,
    image: posterUrl,
    description,
    datePublished: movie.tmdb?.releaseDate,
    inLanguage: movie.tmdb?.originalLanguage,
    duration: movie.tmdb?.runtime ? `PT${movie.tmdb.runtime}M` : undefined,
    sameAs: [
      movie.tmdb?.id
        ? `https://www.themoviedb.org/movie/${movie.tmdb.id}`
        : undefined,
      movie.imdbId ? `https://www.imdb.com/title/${movie.imdbId}/` : undefined,
    ],
    copyrightYear: year,
  })
}

export const buildScreeningEventJsonLd = (
  movie: Movie,
  movieSlug: string,
  screening: Screening,
) => {
  const eventUrl = getCanonicalUrl(
    getMoviePagePath(
      movieSlug,
      screening.cinema.city.slug,
      screening.cinema.slug,
    ),
  )
  const address = screening.cinema.address

  return compactJsonLd({
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: `${movie.title} at ${screening.cinema.name}`,
    startDate: screening.date,
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    eventStatus: 'https://schema.org/EventScheduled',
    url: eventUrl,
    image: getMoviePosterUrl(movie.tmdb?.posterPath, 'w342'),
    location: {
      '@type': 'MovieTheater',
      name: screening.cinema.name,
      url: screening.cinema.url,
      hasMap: address.googleMapsUrl,
      address: {
        '@type': 'PostalAddress',
        streetAddress: address.streetAddress,
        postalCode: address.postalCode,
        addressLocality: address.addressLocality,
        addressCountry: 'NL',
      },
    },
    workFeatured: {
      '@id': `${getCanonicalUrl(getMoviePagePath(movieSlug))}#movie`,
    },
    offers: {
      '@type': 'Offer',
      url: screening.url,
    },
    organizer: {
      '@type': 'Organization',
      name: screening.cinema.name,
      url: screening.cinema.url,
    },
  })
}

export const buildBreadcrumbJsonLd = (
  movie: Movie,
  movieSlug: string,
  city?: string,
  cinema?: string,
  cityName?: string,
  cinemaName?: string,
) => {
  const items = [
    {
      name: 'Expat Cinema',
      item: siteUrl,
    },
    {
      name: movie.title,
      item: getCanonicalUrl(getMoviePagePath(movieSlug)),
    },
  ]

  if (city && cityName) {
    items.push({
      name: cityName,
      item: getCanonicalUrl(getMoviePagePath(movieSlug, city)),
    })
  }

  if (city && cinema && cinemaName) {
    items.push({
      name: cinemaName,
      item: getCanonicalUrl(getMoviePagePath(movieSlug, city, cinema)),
    })
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.item,
    })),
  }
}

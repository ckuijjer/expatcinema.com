import type { Metadata } from 'next'

import { getCinema } from './getCinema'
import { getCity } from './getCity'
import {
  getMoviePosterUrl,
  getMovieReleaseYear,
  getMovieSlug,
  Movie,
} from './getMovies'
import { Screening } from './getScreenings'
import { getMoviePagePath } from './getMoviePagePath'
import { buildMovieDescription } from './seoMetadata'
import { getCanonicalUrl } from './siteUrl'

const getMovieIdScreeningCounts = (screenings: Screening[]) =>
  screenings.reduce<Record<string, number>>((counts, screening) => {
    if (!screening.movieId) {
      return counts
    }

    counts[screening.movieId] = (counts[screening.movieId] ?? 0) + 1
    return counts
  }, {})

const pickRepresentativeMovie = (
  movies: Movie[],
  screenings: Screening[],
): Movie => {
  const moviesWithSlug = movies.filter(
    (movie): movie is Movie & { slug: string } => Boolean(movie.slug),
  )
  const counts = getMovieIdScreeningCounts(screenings)

  return [...moviesWithSlug].sort((left, right) => {
    const leftSlug = getMovieSlug(left) ?? ''
    const rightSlug = getMovieSlug(right) ?? ''
    const countDifference =
      (counts[right.movieId] ?? 0) - (counts[left.movieId] ?? 0)
    if (countDifference !== 0) {
      return countDifference
    }

    return (
      (getMovieReleaseYear(right) ?? 0) - (getMovieReleaseYear(left) ?? 0) ||
      leftSlug.localeCompare(rightSlug)
    )
  })[0]
}

export const getMoviePageData = (
  movies: Movie[],
  screenings: Screening[],
  movieSlug: string,
  city?: string,
  cinema?: string,
) => {
  const matchingMovies = movies.filter((movie) => movie.slug === movieSlug)

  if (matchingMovies.length === 0) {
    return undefined
  }

  const movieIds = new Set(matchingMovies.map((movie) => movie.movieId))
  const representativeMovie = pickRepresentativeMovie(
    matchingMovies,
    screenings,
  )

  const matchingScreenings = screenings.filter((screening) => {
    if (!screening.movieId) {
      return false
    }

    return movieIds.has(screening.movieId)
  })

  const movieScreenings = matchingScreenings.filter((screening) => {
    if (city && screening.cinema.city.slug !== city) {
      return false
    }

    if (cinema && screening.cinema.slug !== cinema) {
      return false
    }

    if (screening.movieId && movieIds.has(screening.movieId)) {
      return true
    }

    return false
  })

  return {
    matchingMovies,
    movie: representativeMovie,
    screenings: movieScreenings,
    availableScreenings: matchingScreenings,
  }
}

export const getMovieRouteSlugs = (
  movies: Movie[],
  screenings: Screening[],
  city?: string,
  cinema?: string,
) => {
  const movieSlugs = new Set(
    movies.flatMap((movie) => (movie.slug ? [movie.slug] : [])),
  )
  const movieSlugByMovieId = new Map<string, string>(
    movies.flatMap((movie) =>
      movie.slug ? [[movie.movieId, movie.slug] as const] : [],
    ),
  )

  const screeningSlugs = new Set<string>()
  screenings.forEach((screening) => {
    if (city && screening.cinema.city.slug !== city) {
      return
    }

    if (cinema && screening.cinema.slug !== cinema) {
      return
    }

    const screeningSlug = screening.movieId
      ? movieSlugByMovieId.get(screening.movieId)
      : undefined

    if (screeningSlug && movieSlugs.has(screeningSlug)) {
      screeningSlugs.add(screeningSlug)
    }
  })

  return Array.from(screeningSlugs)
}

export const buildMoviePageMetadata = (
  movie: Movie,
  movieSlug: string,
  screenings: Screening[],
  city?: string,
  cinema?: string,
): Metadata => {
  const movieYear = getMovieReleaseYear(movie)
  const cityName = city ? (getCity(city)?.name ?? city) : null
  const cinemaName = cinema ? (getCinema(cinema)?.name ?? cinema) : null
  const locationLabel = cinemaName
    ? cityName
      ? `${cinemaName}, ${cityName}`
      : cinemaName
    : cityName
  const title = `${movie.title}${movieYear ? ` (${movieYear})` : ''}`
  const description = buildMovieDescription(
    title,
    movie.tmdb?.overview ?? undefined,
    screenings,
    locationLabel,
  )
  const posterUrl = getMoviePosterUrl(movie.tmdb?.posterPath, 'w342')

  return {
    title: locationLabel
      ? `${title} in ${locationLabel} – Expat Cinema`
      : `${title} – Expat Cinema`,
    description,
    alternates: {
      canonical: getCanonicalUrl(getMoviePagePath(movieSlug, city, cinema)),
    },
    openGraph: {
      title: locationLabel
        ? `${title} in ${locationLabel} – Expat Cinema`
        : `${title} – Expat Cinema`,
      description,
      images: posterUrl
        ? [
            {
              url: posterUrl,
              alt: `Poster for ${movie.title}`,
            },
          ]
        : undefined,
    },
    twitter: {
      card: posterUrl ? 'summary_large_image' : 'summary',
      title: locationLabel
        ? `${title} in ${locationLabel} – Expat Cinema`
        : `${title} – Expat Cinema`,
      description,
      images: posterUrl ? [posterUrl] : undefined,
    },
  }
}

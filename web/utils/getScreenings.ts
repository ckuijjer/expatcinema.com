import cinemas from '../data/cinema.json'
import cities from '../data/city.json'
import { MovieData, getMoviePosterUrl, getMovieReleaseYear } from './getMovies'

type ScreeningData = {
  cinema: string
  date: string
  movieId?: string
  // the movieIds of all films of a double feature, the screening is one of them
  doubleFeature?: string[]
  year?: number
  title: string
  url: string
}

export type City = {
  name: string
  slug: string
}

export type Address = {
  streetAddress: string
  postalCode: string
  addressLocality: string
  googleMapsUrl: string
}

export type Cinema = {
  name: string
  slug: string
  url: string
  city: City
  address: Address
  logo?: string
}

// A film of a double feature
export type DoubleFeatureFilm = {
  movieId: string
  title: string
  movieSlug?: string
  posterUrl?: string
}

export type Screening = {
  cinema: Cinema
  date: string
  movieId?: string
  // all films that are shown with this ticket, in the order they are shown.
  // A double feature has a screening per film, with the same url and date.
  doubleFeature?: DoubleFeatureFilm[]
  movieSlug?: string
  posterUrl?: string
  title: string
  url: string
  year?: number
}

export const getScreenings = async () => {
  const bucket = process.env.PUBLIC_BUCKET
  const screeningsUrl = `https://s3-eu-west-1.amazonaws.com/${bucket}/screenings.json`
  const moviesUrl = `https://s3-eu-west-1.amazonaws.com/${bucket}/movies.json`

  const [screeningsResponse, moviesResponse] = await Promise.all([
    fetch(screeningsUrl),
    fetch(moviesUrl),
  ])

  const [screeningsData, moviesData]: [ScreeningData[], MovieData[]] =
    await Promise.all([screeningsResponse.json(), moviesResponse.json()])

  const moviesById = new Map(moviesData.map((movie) => [movie.movieId, movie]))

  const screenings: Screening[] = screeningsData.map((screening) => {
    const cinemaData = cinemas.find(
      (cinema) => cinema.name === screening.cinema,
    )

    const cinema = {
      ...cinemaData,
      city: cities.find((city) => city.slug === cinemaData?.city),
    } as Cinema
    const movie = screening.movieId
      ? moviesById.get(screening.movieId)
      : undefined
    const movieYear = movie ? getMovieReleaseYear(movie) : undefined
    const movieSlug = movie?.slug

    const doubleFeature = screening.doubleFeature?.map((movieId) => {
      const film = moviesById.get(movieId)

      return {
        movieId,
        title: film?.title ?? screening.title,
        movieSlug: film?.slug,
        posterUrl: getMoviePosterUrl(film?.tmdb?.posterPath),
      }
    })

    return {
      ...screening,
      doubleFeature,
      title: movie?.title ?? screening.title,
      year: movieYear ?? screening.year,
      movieSlug,
      cinema,
      posterUrl: screening.movieId
        ? getMoviePosterUrl(movie?.tmdb?.posterPath)
        : undefined,
    }
  })

  return screenings
}

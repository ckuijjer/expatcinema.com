import cinemas from '../data/cinema.json'
import cities from '../data/city.json'
import { MovieData, getMoviePosterUrl, getMovieReleaseYear } from './getMovies'

type ScreeningData = {
  cinema: string
  date: string
  movieId?: string
  year?: number
  title: string
  url: string
  // the festival or series the screening belongs to
  event?: string
  // what is special about this screening: "Q&A", "4K Restoration"
  notes?: string[]
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

export type Screening = {
  cinema: Cinema
  date: string
  movieId?: string
  movieSlug?: string
  posterUrl?: string
  title: string
  url: string
  year?: number
  event?: string
  notes?: string[]
  // for the search: what the film is called in its own language, and who
  // made it. The original title is left out when it is the title
  originalTitle?: string
  directors?: string[]
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
    const title = movie?.title ?? screening.title
    const originalTitle = movie?.tmdb?.originalTitle
    const directors = movie?.tmdb?.directors

    return {
      ...screening,
      title,
      year: movieYear ?? screening.year,
      movieSlug,
      ...(originalTitle &&
        originalTitle.toLowerCase() !== title.toLowerCase() && {
          originalTitle,
        }),
      ...(directors?.length && { directors }),
      cinema,
      posterUrl: screening.movieId
        ? getMoviePosterUrl(movie?.tmdb?.posterPath)
        : undefined,
    }
  })

  return screenings
}

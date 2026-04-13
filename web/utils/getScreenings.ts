import cinemas from '../data/cinema.json'
import cities from '../data/city.json'

type ScreeningData = {
  cinema: string
  date: string
  movieId?: string
  year?: number
  title: string
  url: string
}

type MovieData = {
  movieId: string
  tmdb?: {
    posterPath?: string | null
  }
}

export type City = {
  name: string
  slug: string
}

export type Cinema = {
  name: string
  slug: string
  url: string
  city: City
  logo?: string
}

export type Screening = {
  cinema: Cinema
  date: string
  movieId?: string
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

  const moviesById = new Map(
    moviesData.map((movie) => [movie.movieId, movie.tmdb?.posterPath]),
  )

  const screenings: Screening[] = screeningsData.map((screening) => {
    const cinemaData = cinemas.find(
      (cinema) => cinema.name === screening.cinema,
    )

    const cinema = {
      ...cinemaData,
      city: cities.find((city) => city.slug === cinemaData?.city),
    } as Cinema

    return {
      ...screening,
      cinema,
      posterUrl: screening.movieId
        ? getTmdbPosterUrl(moviesById.get(screening.movieId))
        : undefined,
    }
  })

  return screenings
}

const getTmdbPosterUrl = (posterPath?: string | null) => {
  if (!posterPath) {
    return undefined
  }

  return `https://image.tmdb.org/t/p/w92${posterPath}`
}

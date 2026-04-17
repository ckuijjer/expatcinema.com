export type MovieData = {
  movieId: string
  slug?: string
  title: string
  sortTitle?: string
  tmdbId: number
  imdbId?: string
  tmdb?: {
    backdropPath?: string | null
    genreIds?: number[]
    id?: number
    originalLanguage?: string | null
    originalTitle?: string | null
    overview?: string | null
    posterPath?: string | null
    releaseDate?: string | null
    title?: string | null
    voteAverage?: number | null
  }
}

export type Movie = Omit<MovieData, 'slug'> & { slug?: string }

export const getMovies = async (): Promise<Movie[]> => {
  const bucket = process.env.PUBLIC_BUCKET
  const moviesUrl = `https://s3-eu-west-1.amazonaws.com/${bucket}/movies.json`
  const moviesResponse = await fetch(moviesUrl)
  const moviesData: MovieData[] = await moviesResponse.json()

  return moviesData.map((movie) => ({
    ...movie,
    slug: movie.slug,
  }))
}

export const getMovieSlug = (movie: Pick<Movie, 'slug'>) => movie.slug

export const getMovieBySlug = (movies: Movie[], slug: string) =>
  movies.find((movie) => movie.slug === slug)

export const getMoviePosterUrl = (
  posterPath?: string | null,
  size: 'w92' | 'w342' = 'w92',
) => {
  if (!posterPath) {
    return undefined
  }

  return `https://image.tmdb.org/t/p/${size}${posterPath}`
}

export const getMovieReleaseYear = (movie: Pick<Movie, 'tmdb'>) => {
  const releaseDate = movie.tmdb?.releaseDate
  if (!releaseDate) {
    return undefined
  }

  const year = Number(releaseDate.slice(0, 4))
  return Number.isFinite(year) ? year : undefined
}

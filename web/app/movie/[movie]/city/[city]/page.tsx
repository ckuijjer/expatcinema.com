import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { MoviePage } from '../../../../../components/MoviePage'
import { getMovies } from '../../../../../utils/getMovies'
import {
  buildMoviePageMetadata,
  getMoviePageData,
  getMovieRouteSlugs,
} from '../../../../../utils/getMoviePageData'
import { getScreenings } from '../../../../../utils/getScreenings'

export const generateStaticParams = async () => {
  const [movies, screenings] = await Promise.all([getMovies(), getScreenings()])
  const cities = Array.from(
    new Set(screenings.map((screening) => screening.cinema.city.slug)),
  )

  return cities.flatMap((city) =>
    getMovieRouteSlugs(movies, screenings, city).map((movie) => ({
      city,
      movie,
    })),
  )
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ city: string; movie: string }>
}): Promise<Metadata> {
  const { city, movie: movieSlug } = await params
  const [movies, screenings] = await Promise.all([getMovies(), getScreenings()])
  const data = getMoviePageData(movies, screenings, movieSlug, city)

  if (!data) {
    return {}
  }

  return buildMoviePageMetadata(data.movie, movieSlug, data.screenings, city)
}

export default async function CityMoviePage({
  params,
}: {
  params: Promise<{ city: string; movie: string }>
}) {
  const { city, movie: movieSlug } = await params
  const [movies, screenings] = await Promise.all([getMovies(), getScreenings()])
  const data = getMoviePageData(movies, screenings, movieSlug, city)

  if (!data) {
    notFound()
  }

  return (
    <MoviePage
      movie={data.movie}
      movieSlug={movieSlug}
      screenings={data.screenings}
      availableScreenings={data.availableScreenings}
      currentCity={city}
      showCity
    />
  )
}

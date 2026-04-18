import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { MoviePage } from '../../../../../../../components/MoviePage'
import cinemas from '../../../../../../../data/cinema.json'
import { getMovies } from '../../../../../../../utils/getMovies'
import {
  buildMoviePageMetadata,
  getMoviePageData,
  getMovieRouteSlugs,
} from '../../../../../../../utils/getMoviePageData'
import { getScreenings } from '../../../../../../../utils/getScreenings'

export const generateStaticParams = async () => {
  const [movies, screenings] = await Promise.all([getMovies(), getScreenings()])

  return cinemas.flatMap(({ city, slug }) =>
    getMovieRouteSlugs(movies, screenings, city, slug).map((movie) => ({
      city,
      cinema: slug,
      movie,
    })),
  )
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ city: string; cinema: string; movie: string }>
}): Promise<Metadata> {
  const { city, cinema, movie: movieSlug } = await params
  const [movies, screenings] = await Promise.all([getMovies(), getScreenings()])
  const data = getMoviePageData(movies, screenings, movieSlug, city, cinema)

  if (!data) {
    return {}
  }

  return buildMoviePageMetadata(data.movie, movieSlug, city, cinema)
}

export default async function CityCinemaMoviePage({
  params,
}: {
  params: Promise<{ city: string; cinema: string; movie: string }>
}) {
  const { city, cinema, movie: movieSlug } = await params
  const [movies, screenings] = await Promise.all([getMovies(), getScreenings()])
  const data = getMoviePageData(movies, screenings, movieSlug, city, cinema)

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
      currentCinema={cinema}
      showCity
    />
  )
}

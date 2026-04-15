import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { MoviePage } from '../../../../components/MoviePage'
import { getMovies } from '../../../../utils/getMovies'
import {
  buildMoviePageMetadata,
  getMoviePageData,
  getMovieRouteSlugs,
} from '../../../../utils/getMoviePageData'
import { getScreenings } from '../../../../utils/getScreenings'

export const generateStaticParams = async () => {
  const [movies, screenings] = await Promise.all([getMovies(), getScreenings()])
  return getMovieRouteSlugs(movies, screenings).map((movie) => ({ movie }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ movie: string }>
}): Promise<Metadata> {
  const { movie: movieSlug } = await params
  const [movies, screenings] = await Promise.all([getMovies(), getScreenings()])
  const data = getMoviePageData(movies, screenings, movieSlug)

  if (!data) {
    return {}
  }

  return buildMoviePageMetadata(data.movie, movieSlug)
}

export default async function MoviePageRoute({
  params,
}: {
  params: Promise<{ movie: string }>
}) {
  const { movie: movieSlug } = await params
  const [movies, screenings] = await Promise.all([getMovies(), getScreenings()])
  const data = getMoviePageData(movies, screenings, movieSlug)

  if (!data) {
    notFound()
  }

  return (
    <MoviePage
      movie={data.movie}
      screenings={data.screenings}
      showCity
    />
  )
}

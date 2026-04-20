import type { Metadata } from 'next'
import { Suspense } from 'react'

import { MoviesOverview } from '../../components/MoviesOverview'
import { NavigationBar } from '../../components/NavigationBar'
import { Layout } from '../../components/Layout'
import { getMovies } from '../../utils/getMovies'
import { palette } from '../../utils/theme'

export const metadata: Metadata = {
  title: 'Movies – Expat Cinema',
  alternates: { canonical: 'https://expatcinema.com/movie' },
}

export default async function MoviesPage() {
  const movies = await getMovies()

  return (
    <>
      <Layout backgroundColor={palette.purple600}>
        <Suspense>
          <NavigationBar />
        </Suspense>
      </Layout>
      <Suspense>
        <MoviesOverview movies={movies} />
      </Suspense>
    </>
  )
}

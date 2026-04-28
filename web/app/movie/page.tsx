import type { Metadata } from 'next'
import { Suspense } from 'react'

import { MoviesOverview } from '../../components/MoviesOverview'
import { NavigationBar } from '../../components/NavigationBar'
import { Layout } from '../../components/Layout'
import { getMovies } from '../../utils/getMovies'
import { getCanonicalUrl } from '../../utils/siteUrl'

export const metadata: Metadata = {
  title: 'Movies – Expat Cinema',
  alternates: { canonical: getCanonicalUrl('/movie') },
}

export default async function MoviesPage() {
  const movies = await getMovies()

  return (
    <>
      <Layout backgroundColor="var(--palette-purple-600)">
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

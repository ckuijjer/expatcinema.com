import type { Metadata } from 'next'
import { Suspense } from 'react'

import { NavigationBar } from '../../../components/NavigationBar'
import { Layout } from '../../../components/Layout'
import { UnmatchedMoviesOverview } from '../../../components/UnmatchedMoviesOverview'
import { getScreenings } from '../../../utils/getScreenings'

export const metadata: Metadata = {
  title: 'Unmatched movies – Expat Cinema',
  alternates: { canonical: 'https://expatcinema.com/movie/unmatched' },
  robots: {
    index: false,
    follow: false,
  },
}

export default async function UnmatchedMoviesPage() {
  const screenings = await getScreenings()

  return (
    <>
      <Layout backgroundColor="var(--palette-purple-600)">
        <Suspense>
          <NavigationBar />
        </Suspense>
      </Layout>
      <Suspense>
        <UnmatchedMoviesOverview screenings={screenings} />
      </Suspense>
    </>
  )
}

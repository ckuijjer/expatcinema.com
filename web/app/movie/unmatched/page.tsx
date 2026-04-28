import type { Metadata } from 'next'
import { Suspense } from 'react'

import { NavigationBar } from '../../../components/NavigationBar'
import { Layout } from '../../../components/Layout'
import { UnmatchedMoviesOverview } from '../../../components/UnmatchedMoviesOverview'
import { getScreenings } from '../../../utils/getScreenings'
import { truncateDescription } from '../../../utils/seoMetadata'
import { getCanonicalUrl } from '../../../utils/siteUrl'

export const metadata: Metadata = {
  title: 'Unmatched movies – Expat Cinema',
  description: truncateDescription(
    'Internal review page for Expat Cinema screenings that have not yet been matched to movie metadata.',
  ),
  alternates: { canonical: getCanonicalUrl('/movie/unmatched') },
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

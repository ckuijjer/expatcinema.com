import type { Metadata } from 'next'
import { Suspense } from 'react'

import { App } from '../../components/App'
import { getScreenings } from '../../utils/getScreenings'
import { getCanonicalUrl } from '../../utils/siteUrl'

export const metadata: Metadata = {
  title: 'Expat Cinema',
  alternates: { canonical: getCanonicalUrl() },
}

export default async function Home() {
  const screenings = await getScreenings()
  return (
    <Suspense>
      <App screenings={screenings} showCity />
    </Suspense>
  )
}

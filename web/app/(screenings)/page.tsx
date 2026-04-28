import type { Metadata } from 'next'
import { Suspense } from 'react'

import { App } from '../../components/App'
import { getScreenings } from '../../utils/getScreenings'
import { defaultDescription } from '../../utils/seoMetadata'
import { getCanonicalUrl } from '../../utils/siteUrl'

export const metadata: Metadata = {
  title: 'Expat Cinema',
  description: defaultDescription,
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

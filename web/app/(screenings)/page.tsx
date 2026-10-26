import type { Metadata } from 'next'
import { Suspense } from 'react'

import { App } from '../../components/App'
import { JsonLd } from '../../components/JsonLd'
import { getScreenings } from '../../utils/getScreenings'
import { buildWebSiteJsonLd } from '../../utils/jsonLd'
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
      <JsonLd data={buildWebSiteJsonLd()} />
      <App screenings={screenings} showCity />
    </Suspense>
  )
}

import type { Metadata } from 'next'
import React, { Suspense } from 'react'

import { Layout } from '../../components/Layout'
import { NavigationBar } from '../../components/NavigationBar'
import { PageTitle } from '../../components/PageTitle'
import { truncateDescription } from '../../utils/seoMetadata'
import { getCanonicalUrl } from '../../utils/siteUrl'
import { StatisticsClient } from './StatisticsClient'

export const metadata: Metadata = {
  title: 'Statistics – Expat Cinema',
  description: truncateDescription(
    'Statistics for Expat Cinema screening coverage, showing scraper activity and collected English-subtitled movie listings.',
  ),
  alternates: { canonical: getCanonicalUrl('/statistics') },
  robots: {
    index: false,
    follow: true,
  },
}

export default async function StatisticsPage() {
  const url = `https://${process.env.APIGW_ID}.execute-api.eu-west-1.amazonaws.com/analytics`
  const response = await fetch(url)
  const data = await response.json()

  return (
    <Suspense>
      <Layout backgroundColor="var(--palette-purple-600)">
        <NavigationBar showSearch={false} />
      </Layout>
      <Layout>
        <PageTitle>Statistics</PageTitle>
      </Layout>
      <StatisticsClient points={data} />
    </Suspense>
  )
}

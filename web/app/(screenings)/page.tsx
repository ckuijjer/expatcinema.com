import type { Metadata } from 'next'
import { Suspense } from 'react'

import { App } from '../../components/App'
import { DateFilter } from '../../components/DateFilter'
import { Layout } from '../../components/Layout'
import { getScreenings } from '../../utils/getScreenings'
import { getScreeningDates } from '../../utils/getScreeningDates'
import { defaultDescription } from '../../utils/seoMetadata'
import { getCanonicalUrl } from '../../utils/siteUrl'

export const metadata: Metadata = {
  title: 'Expat Cinema',
  description: defaultDescription,
  alternates: { canonical: getCanonicalUrl() },
}

export default async function Home() {
  const screenings = await getScreenings()
  const dates = getScreeningDates(screenings)
  return (
    <>
      <Layout noPadding>
        <Suspense>
          <DateFilter dates={dates} />
        </Suspense>
      </Layout>
      <Suspense>
        <App screenings={screenings} showCity />
      </Suspense>
    </>
  )
}

import type { Metadata } from 'next'
import { Suspense } from 'react'

import { About } from '../../components/About'
import { defaultDescription } from '../../utils/seoMetadata'
import { getCanonicalUrl } from '../../utils/siteUrl'

export const metadata: Metadata = {
  title: 'About – Expat Cinema',
  description: defaultDescription,
  alternates: { canonical: getCanonicalUrl('/about') },
}

export default function AboutPage() {
  return (
    <Suspense>
      <About />
    </Suspense>
  )
}

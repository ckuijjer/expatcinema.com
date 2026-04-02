import type { Metadata } from 'next'
import { Suspense } from 'react'

import { About } from '../../components/About'

export const metadata: Metadata = {
  title: 'About – Expat Cinema',
  alternates: { canonical: 'https://expatcinema.com/about' },
}

export default function AboutPage() {
  return (
    <Suspense>
      <About />
    </Suspense>
  )
}

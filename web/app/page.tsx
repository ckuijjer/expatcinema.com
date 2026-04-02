import type { Metadata } from 'next'
import { Suspense } from 'react'

import { App } from '../components/App'
import { getScreenings } from '../utils/getScreenings'

export const metadata: Metadata = {
  title: 'Expat Cinema',
  alternates: { canonical: 'https://expatcinema.com' },
}

export default async function Home() {
  const screenings = await getScreenings()
  return (
    <Suspense>
      <App screenings={screenings} showCity />
    </Suspense>
  )
}

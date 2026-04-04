import React, { Suspense } from 'react'

import { CityFilter } from '../../components/CityFilter'
import { Layout } from '../../components/Layout'
import { NavigationBar } from '../../components/NavigationBar'
import { palette } from '../../utils/theme'

export default function ScreeningsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Layout backgroundColor={palette.purple600}>
        <Suspense>
          <NavigationBar />
        </Suspense>
      </Layout>
      <Layout backgroundColor={palette.purple400}>
        <Suspense>
          <CityFilter />
        </Suspense>
      </Layout>
      {children}
    </>
  )
}

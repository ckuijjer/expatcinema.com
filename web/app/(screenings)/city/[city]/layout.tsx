import React, { Suspense } from 'react'

import { CinemaFilter } from '../../../../components/CinemaFilter'
import { Layout } from '../../../../components/Layout'
import { palette } from '../../../../utils/theme'

export default function CityLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Layout backgroundColor={palette.purple300}>
        <Suspense>
          <CinemaFilter />
        </Suspense>
      </Layout>
      {children}
    </>
  )
}

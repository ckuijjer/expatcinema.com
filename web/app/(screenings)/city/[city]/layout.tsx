import React, { Suspense } from 'react'

import { CinemaFilter } from '../../../../components/CinemaFilter'
import { FilterLink } from '../../../../components/CityFilter'
import { HideOnMovieRoute } from '../../../../components/HideOnMovieRoute'
import { Layout } from '../../../../components/Layout'
import { buildCinemaFilterLinks } from '../../../../utils/getFilterLinks'
import { getScreenings } from '../../../../utils/getScreenings'
import { palette } from '../../../../utils/theme'

export default async function CityLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ city: string }>
}) {
  const { city } = await params
  const screenings = await getScreenings()
  const links: FilterLink[] = buildCinemaFilterLinks(screenings, city)

  return (
    <>
      <Layout backgroundColor={palette.purple300}>
        <Suspense>
          <HideOnMovieRoute>
            <CinemaFilter links={links} />
          </HideOnMovieRoute>
        </Suspense>
      </Layout>
      {children}
    </>
  )
}

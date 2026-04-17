import React, { Suspense } from 'react'

import { CityFilter, FilterLink } from '../../components/CityFilter'
import { HideOnMovieRoute } from '../../components/HideOnMovieRoute'
import { Layout } from '../../components/Layout'
import { NavigationBar } from '../../components/NavigationBar'
import { buildCityFilterLinks } from '../../utils/getFilterLinks'
import { getScreenings } from '../../utils/getScreenings'
import { palette } from '../../utils/theme'

export default async function ScreeningsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const screenings = await getScreenings()
  const links: FilterLink[] = buildCityFilterLinks(screenings)

  return (
    <>
      <Layout backgroundColor={palette.purple600}>
        <Suspense>
          <NavigationBar />
        </Suspense>
      </Layout>
      <Layout backgroundColor={palette.purple400}>
        <Suspense>
          <HideOnMovieRoute>
            <CityFilter links={links} />
          </HideOnMovieRoute>
        </Suspense>
      </Layout>
      {children}
    </>
  )
}

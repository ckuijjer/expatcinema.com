import React, { Suspense } from 'react'

import cities from '../../data/city.json'
import { CityFilter, FilterLink } from '../../components/CityFilter'
import { FullBleedSection } from '../../components/FullBleedSection'
import { Layout } from '../../components/Layout'
import { NavigationBar } from '../../components/NavigationBar'
import { getScreenings } from '../../utils/getScreenings'
import { palette } from '../../utils/theme'

export default async function ScreeningsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const screenings = await getScreenings()
  const screeningCountByCity = screenings.reduce<Record<string, number>>(
    (counts, screening) => {
      counts[screening.cinema.city.slug] =
        (counts[screening.cinema.city.slug] ?? 0) + 1
      return counts
    },
    {},
  )

  const links: FilterLink[] = [
    { text: 'All', slug: null },
    ...cities
      .map(({ name, slug }) => ({
        text: name,
        slug,
        count: screeningCountByCity[slug] ?? 0,
      }))
      .sort(
        (left, right) =>
          right.count - left.count || left.text.localeCompare(right.text),
      )
      .map(({ text, slug }) => ({ text, slug })),
  ]

  return (
    <>
      <Layout backgroundColor={palette.purple600}>
        <Suspense>
          <NavigationBar />
        </Suspense>
      </Layout>
      <FullBleedSection backgroundColor={palette.purple400}>
        <Suspense>
          <CityFilter links={links} />
        </Suspense>
      </FullBleedSection>
      {children}
    </>
  )
}

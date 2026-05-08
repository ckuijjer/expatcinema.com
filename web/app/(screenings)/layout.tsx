import React, { Suspense } from 'react'

import { DateTime } from 'luxon'

import cities from '../../data/city.json'
import { CityFilter, FilterLink } from '../../components/CityFilter'
import { DateFilter } from '../../components/DateFilter'
import { Layout } from '../../components/Layout'
import { NavigationBar } from '../../components/NavigationBar'
import { getScreenings } from '../../utils/getScreenings'

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

  const dates = [
    ...new Set(
      screenings.map((s) =>
        DateTime.fromISO(s.date, { setZone: true })
          .setZone('Europe/Amsterdam')
          .toISODate() ?? '',
      ),
    ),
  ].sort()

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
      <Layout backgroundColor="var(--palette-purple-600)">
        <Suspense>
          <NavigationBar />
        </Suspense>
      </Layout>
      <Layout backgroundColor="var(--palette-purple-400)" noPadding>
        <Suspense>
          <CityFilter links={links} />
        </Suspense>
      </Layout>
      <Layout backgroundColor="var(--palette-purple-200)" noPadding>
        <Suspense>
          <DateFilter dates={dates} />
        </Suspense>
      </Layout>
      {children}
    </>
  )
}

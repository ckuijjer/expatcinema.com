import React, { Suspense } from 'react'

import { CinemaFilter } from '../../../../components/CinemaFilter'
import { FilterLink } from '../../../../components/CityFilter'
import { DateFilter } from '../../../../components/DateFilter'
import { Layout } from '../../../../components/Layout'
import cinemas from '../../../../data/cinema.json'
import { getScreenings } from '../../../../utils/getScreenings'
import { getScreeningDates } from '../../../../utils/getScreeningDates'

export default async function CityLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ city: string }>
}) {
  const { city } = await params
  const screenings = await getScreenings()
  const cityScreenings = screenings.filter(
    (screening) => screening.cinema.city.slug === city,
  )

  const screeningCountByCinema = cityScreenings.reduce<Record<string, number>>(
    (counts, screening) => {
      counts[screening.cinema.slug] = (counts[screening.cinema.slug] ?? 0) + 1
      return counts
    },
    {},
  )

  const links: FilterLink[] = [
    { text: 'All', slug: null },
    ...cinemas
      .filter((cinema) => cinema.city === city)
      .map(({ name, slug }) => ({
        text: name,
        slug,
        count: screeningCountByCinema[slug] ?? 0,
      }))
      .sort(
        (left, right) =>
          right.count - left.count || left.text.localeCompare(right.text),
      )
      .map(({ text, slug }) => ({ text, slug })),
  ]

  const dates = getScreeningDates(cityScreenings)

  return (
    <>
      <Layout backgroundColor="var(--palette-purple-300)" noPadding>
        <Suspense>
          <CinemaFilter links={links} />
        </Suspense>
      </Layout>
      <Layout noPadding>
        <Suspense>
          <DateFilter dates={dates} />
        </Suspense>
      </Layout>
      {children}
    </>
  )
}

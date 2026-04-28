import Link from 'next/link'
import React, { Suspense } from 'react'

import { css } from 'styled-system/css'

import { CinemaFilter } from '../../../../components/CinemaFilter'
import { FilterLink } from '../../../../components/CityFilter'
import cinemas from '../../../../data/cinema.json'
import { getCity } from '../../../../utils/getCity'
import { getScreenings } from '../../../../utils/getScreenings'
import { Layout } from '../../../../components/Layout'

const cinemaLinksStyle = css({
  marginTop: '12px',
  marginBottom: '0',
  fontSize: '14px',
  lineHeight: '1.5',
  color: 'var(--text-muted-color)',
})

const cinemaAnchorStyle = css({
  color: 'var(--secondary-color)',
})

export default async function CityLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ city: string }>
}) {
  const { city } = await params
  const screenings = await getScreenings()
  const cityName = getCity(city)?.name ?? city

  const screeningCountByCinema = screenings
    .filter((screening) => screening.cinema.city.slug === city)
    .reduce<Record<string, number>>((counts, screening) => {
      counts[screening.cinema.slug] = (counts[screening.cinema.slug] ?? 0) + 1
      return counts
    }, {})

  const cinemasInCity = cinemas
    .filter((cinema) => cinema.city === city)
    .map((cinema) => ({
      ...cinema,
      count: screeningCountByCinema[cinema.slug] ?? 0,
    }))
    .sort(
      (left, right) =>
        right.count - left.count || left.name.localeCompare(right.name),
    )

  const links: FilterLink[] = [
    { text: 'All', slug: null },
    ...cinemasInCity.map(({ name, slug }) => ({
      text: name,
      slug,
    })),
  ]

  return (
    <>
      <Layout backgroundColor="var(--palette-purple-300)" noPadding>
        <Suspense>
          <CinemaFilter links={links} />
        </Suspense>
      </Layout>
      {cinemasInCity.length ? (
        <Layout>
          <p className={cinemaLinksStyle}>
            Browse cinema pages in {cityName}:{' '}
            {cinemasInCity.map((cinema, index) => (
              <React.Fragment key={cinema.slug}>
                <Link
                  href={`/city/${city}/cinema/${cinema.slug}`}
                  className={cinemaAnchorStyle}
                >
                  English-subtitled movies at {cinema.name}
                </Link>
                {index === cinemasInCity.length - 1 ? '' : ', '}
              </React.Fragment>
            ))}
          </p>
        </Layout>
      ) : null}
      {children}
    </>
  )
}

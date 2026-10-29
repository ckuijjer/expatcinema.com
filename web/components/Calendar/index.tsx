'use client'

import { DateTime } from 'luxon'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import React, { useEffect } from 'react'

import { css } from 'styled-system/css'

import { getCinema } from '../../utils/getCinema'
import { getCity } from '../../utils/getCity'
import { Screening } from '../../utils/getScreenings'
import {
  ScreeningWithLuxonDate,
  groupAndSortScreenings,
} from '../../utils/groupAndSortScreenings'
import { getMoviePagePath } from '../../utils/getMoviePagePath'
import { countSearch } from '../../utils/goatcounter'
import { useSearch } from '../../utils/hooks'
import { matchesScreeningSearch } from '../../utils/searchMatches'
import { DirectCalendar } from './DirectCalendar'
import { listSectionHeadingStyle } from '../listStyles'

export type Row =
  | { component: 'RelativeDate'; props: { children: string } }
  | {
      component: 'ScreeningRow'
      props: ScreeningWithLuxonDate & { movieHref?: string }
    }

const containerStyle = css({
  marginTop: '24px',
  marginBottom: '24px',
})

const searchEverywhereStyle = css({
  color: 'var(--link-color)',
})

export const Calendar = ({
  screenings,
  showCity,
  showPoster = true,
  showTitle = true,
  runtimeMinutes,
  currentCity,
  currentCinema,
}: {
  screenings: Screening[]
  showCity: boolean
  showPoster?: boolean
  showTitle?: boolean
  runtimeMinutes?: number | null
  currentCity?: string
  currentCinema?: string
}) => {
  const { search, searchComponents } = useSearch()

  const screeningsByDate = Object.entries(
    groupAndSortScreenings(screenings),
  ).sort(([a], [b]) => {
    return +DateTime.fromISO(a) - +DateTime.fromISO(b)
  })

  const rows = screeningsByDate.flatMap(([date, screenings]) => {
    const filteredScreenings = screenings?.filter((screening) =>
      matchesScreeningSearch(screening, searchComponents),
    )

    if (!filteredScreenings?.length) return []

    return [
      { component: 'RelativeDate' as const, props: { children: date } },
      ...filteredScreenings.map((screening) => ({
        component: 'ScreeningRow' as const,
        props: {
          ...screening,
          movieHref: screening.movieSlug
            ? getMoviePagePath(screening.movieSlug, currentCity, currentCinema)
            : undefined,
        },
      })),
    ]
  })

  // A page of a city, a cinema or a film has only some of the screenings, so
  // nothing found there says little about the film. The home page has all
  const local = Boolean(currentCity || currentCinema) || !showTitle

  // a search is counted once it is left alone, with whether it found anything
  const found = rows.length > 0
  useEffect(() => {
    countSearch(search, found, local)
  }, [search, found, local])

  const locationLabel = (() => {
    if (currentCinema) {
      const cinemaData = getCinema(currentCinema)
      if (cinemaData) {
        const cityName = getCity(currentCity ?? '')?.name ?? cinemaData.city
        return `in ${cinemaData.name}, ${cityName}`
      }
    }
    if (currentCity) {
      const cityData = getCity(currentCity)
      if (cityData) return `in ${cityData.name}`
    }
    return null
  })()

  const emptyStateMessage = [
    'No screenings found',
    locationLabel,
    search ? `for ${search}` : null,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={containerStyle}>
      {rows.length === 0 ? (
        <>
          <h3 className={listSectionHeadingStyle}>{emptyStateMessage}</h3>
          {search && local && showTitle ? (
            <Link
              href={`/?search=${encodeURIComponent(search)}`}
              className={searchEverywhereStyle}
            >
              Search all cities for {search}
            </Link>
          ) : null}
        </>
      ) : (
        <DirectCalendar
          rows={rows}
          // what the page already says is left out of the rows
          showCity={showCity && !currentCity}
          showCinema={!currentCinema}
          showTitle={showTitle}
          showPoster={showPoster}
          runtimeMinutes={runtimeMinutes}
        />
      )}
    </div>
  )
}

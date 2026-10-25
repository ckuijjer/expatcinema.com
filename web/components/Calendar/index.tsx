'use client'

import { DateTime } from 'luxon'
import dynamic from 'next/dynamic'
import React from 'react'

import { css } from 'styled-system/css'

import { getCinema } from '../../utils/getCinema'
import { getCity } from '../../utils/getCity'
import { DoubleFeatureFilm, Screening } from '../../utils/getScreenings'
import {
  ScreeningWithLuxonDate,
  groupAndSortScreenings,
  withoutDoubleFeatureRepeats,
} from '../../utils/groupAndSortScreenings'
import { getMoviePagePath } from '../../utils/getMoviePagePath'
import { useSearch } from '../../utils/hooks'
import { matchesScreeningSearch } from '../../utils/searchMatches'
import { DirectCalendar } from './DirectCalendar'
import { listSectionHeadingStyle } from '../listStyles'

export type Row =
  | { component: 'RelativeDate'; props: { children: string } }
  | {
      component: 'ScreeningRow'
      props: Omit<ScreeningWithLuxonDate, 'doubleFeature'> & {
        movieHref?: string
        doubleFeature?: (DoubleFeatureFilm & { movieHref?: string })[]
      }
    }

const containerStyle = css({
  marginTop: '24px',
  marginBottom: '24px',
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
    // the page of a movie lists a double feature at each of its films; a list of
    // movies shows it once, which is when the title is shown
    groupAndSortScreenings(
      showTitle ? withoutDoubleFeatureRepeats(screenings) : screenings,
    ),
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
          doubleFeature: screening.doubleFeature?.map((film) => ({
            ...film,
            movieHref: film.movieSlug
              ? getMoviePagePath(film.movieSlug, currentCity, currentCinema)
              : undefined,
          })),
        },
      })),
    ]
  })

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
        <h3 className={listSectionHeadingStyle}>{emptyStateMessage}</h3>
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

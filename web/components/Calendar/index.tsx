'use client'

import { DateTime } from 'luxon'
import dynamic from 'next/dynamic'
import React from 'react'

import { css, cx } from 'styled-system/css'

import { headerFont } from '../../utils/theme'
import { getCinema } from '../../utils/getCinema'
import { getCity } from '../../utils/getCity'
import { Screening } from '../../utils/getScreenings'
import {
  ScreeningWithLuxonDate,
  groupAndSortScreenings,
} from '../../utils/groupAndSortScreenings'
import { useSearch } from '../../utils/hooks'
import { DirectCalendar } from './DirectCalendar'
import { removeDiacritics } from '../../utils/removeDiacritics'

export type Row =
  | { component: 'RelativeDate'; props: { children: string } }
  | { component: 'ScreeningRow'; props: ScreeningWithLuxonDate }

const containerStyle = css({
  marginTop: '24px',
  marginBottom: '24px',
})

const emptyStateStyle = css({
  fontSize: '16px',
  fontWeight: '700',
  margin: '12px 0',
})

const screeningMatchesSearch = (
  screening: ScreeningWithLuxonDate,
  searchComponents: string[],
) => {
  const title = removeDiacritics(screening.title.toLowerCase())
  const cinema = removeDiacritics(screening.cinema.name.toLowerCase())
  const city = removeDiacritics(screening.cinema.city.name.toLowerCase())

  return (
    searchComponents.length === 0 ||
    searchComponents.every(
      (searchComponent) =>
        title.includes(searchComponent) ||
        cinema.includes(searchComponent) ||
        city.includes(searchComponent),
    )
  )
}

export const Calendar = ({
  screenings,
  showCity,
  currentCity,
  currentCinema,
}: {
  screenings: Screening[]
  showCity: boolean
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
      screeningMatchesSearch(screening, searchComponents),
    )

    if (!filteredScreenings?.length) return []

    return [
      { component: 'RelativeDate' as const, props: { children: date } },
      ...filteredScreenings.map((screening) => ({
        component: 'ScreeningRow' as const,
        props: screening,
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
        <h3 className={cx(emptyStateStyle, headerFont.className)}>
          {emptyStateMessage}
        </h3>
      ) : (
        <DirectCalendar
          rows={rows}
          showCity={showCity}
          currentCity={currentCity}
          currentCinema={currentCinema}
        />
      )}
    </div>
  )
}

import { DateTime } from 'luxon'
import dynamic from 'next/dynamic'
import React from 'react'

import { css } from 'styled-system/css'

import { isEnabled } from '../../utils/featureFlags'
import { Screening } from '../../utils/getScreenings'
import {
  ScreeningWithLuxonDate,
  groupAndSortScreenings,
} from '../../utils/groupAndSortScreenings'
import { useSearch } from '../../utils/hooks'

export type Row =
  | { component: 'RelativeDate'; props: { children: string } }
  | { component: 'ScreeningRow'; props: ScreeningWithLuxonDate }

const removeDiacritics = (str: string) =>
  str.normalize('NFD').replace(/\p{Diacritic}/gu, '')

const CalendarComponent = isEnabled('virtualized-table')
  ? dynamic(() =>
      import('./VirtualizedCalendar').then((m) => m.VirtualizedCalendar),
    )
  : dynamic(() => import('./DirectCalendar').then((m) => m.DirectCalendar))

const containerStyle = css({
  marginTop: '24px',
  marginBottom: '24px',
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
}: {
  screenings: Screening[]
  showCity: boolean
}) => {
  const { searchComponents } = useSearch()

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

  return (
    <div className={containerStyle}>
      <CalendarComponent rows={rows} showCity={showCity} />
    </div>
  )
}

import React, { useReducer } from 'react'
import { DateTime } from 'luxon'
import dynamic from 'next/dynamic'
import removeAccents from 'remove-accents'

import { Screening } from '../../utils/getScreenings'
import { groupAndSortScreenings } from '../../utils/groupAndSortScreenings'
import { isEnabled } from '../../utils/featureFlags'
import { useSearch } from '../../utils/hooks'

const CalendarComponent = isEnabled('virtualized-table')
  ? dynamic(() =>
      import('./VirtualizedCalendar').then((m) => m.VirtualizedCalendar),
    )
  : dynamic(() => import('./DirectCalendar').then((m) => m.DirectCalendar))

export const Calendar = ({
  screenings,
  showCity,
}: {
  screenings: Screening[]
  showCity: boolean
}) => {
  const { normalizedSearch } = useSearch()

  const screeningsByDate = Object.entries(
    groupAndSortScreenings(screenings),
  ).sort(([a], [b]) => {
    return +DateTime.fromISO(a) - +DateTime.fromISO(b)
  })

  const rows = screeningsByDate
    .map(([date, screenings]) => {
      // filter on text
      const filteredScreenings = screenings.filter((screening) => {
        const normalizedTitle = removeAccents(screening.title.toLowerCase())
        const normalizedCinema = removeAccents(
          screening.cinema.name.toLowerCase(),
        )
        const normalizedCity = removeAccents(
          screening.cinema.city.name.toLowerCase(),
        )

        return (
          normalizedSearch === undefined ||
          normalizedTitle.includes(normalizedSearch) ||
          normalizedCinema.includes(normalizedSearch) ||
          normalizedCity.includes(normalizedSearch)
        )
      })
      if (filteredScreenings.length) {
        return [date, filteredScreenings]
      }
      return null
    })
    .filter((x) => x)
    .map(([date, screenings]) => {
      return [
        { component: 'RelativeDate', props: { children: date } },
        ...screenings.map((screening) => ({
          component: 'Screening',
          props: screening,
        })),
      ]
    })
    .flat()

  return <CalendarComponent rows={rows} showCity={showCity} />
}

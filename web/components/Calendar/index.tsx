import React, { useReducer } from 'react'
import { DateTime } from 'luxon'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/router'

import { Screening } from '../getScreenings'
import groupAndSortScreenings from '../groupAndSortScreenings'
import { isEnabled } from '../featureFlags'

const CalendarComponent = isEnabled('virtualized-table')
  ? dynamic(() => import('./VirtualizedCalendar'))
  : dynamic(() => import('./DirectCalendar'))

const flatten = (acc, cur) => [...acc, ...cur]

const Calendar = ({
  screenings,
  showCity,
}: {
  screenings: Screening[]
  showCity: boolean
}) => {
  const router = useRouter()
  const { search } = router.query

  const screeningsByDate = Object.entries(
    groupAndSortScreenings(screenings),
  ).sort(([a], [b]) => {
    return +DateTime.fromISO(a) - +DateTime.fromISO(b)
  })

  const rows = screeningsByDate
    .map(([date, screenings]) => {
      // filter on text
      const filteredScreenings = screenings.filter(
        (screening) =>
          search === undefined ||
          screening.title.toLowerCase().includes(search.toLowerCase()) ||
          screening.cinema.name.toLowerCase().includes(search.toLowerCase()) ||
          screening.cinema.city.name
            .toLowerCase()
            .includes(search.toLowerCase()),
      )
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
    .reduce(flatten, [])

  return <CalendarComponent rows={rows} showCity={showCity} />
}

export default Calendar

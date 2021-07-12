import React from 'react'
import { DateTime } from 'luxon'
import { useQueryParam, StringParam } from 'use-query-params'

import groupAndSortScreenings from '../groupAndSortScreenings'
import { isEnabled } from '../featureFlags'
import DirectCalendar from './DirectCalendar'
import VirtualizedCalendar from './VirtualizedCalendar'

const flatten = (acc, cur) => [...acc, ...cur]

const Calendar = ({ screenings }) => {
  const [search] = useQueryParam('search', StringParam)

  const screeningsByDate = Object.entries(
    groupAndSortScreenings(screenings),
  ).sort(([a], [b]) => {
    return DateTime.fromISO(a) - DateTime.fromISO(b)
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

  return isEnabled('virtualized-table') ? (
    <VirtualizedCalendar rows={rows} />
  ) : (
    <DirectCalendar rows={rows} />
  )
}

export default Calendar

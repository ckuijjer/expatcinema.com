import { css } from '@emotion/react'
import { DateTime } from 'luxon'
import dynamic from 'next/dynamic'
import React, { useReducer } from 'react'
import removeAccents from 'remove-accents'

import { isEnabled } from '../../utils/featureFlags'
import { Screening } from '../../utils/getScreenings'
import { groupAndSortScreenings } from '../../utils/groupAndSortScreenings'
import { useSearch } from '../../utils/hooks'

const CalendarComponent = isEnabled('virtualized-table')
  ? dynamic(() =>
      import('./VirtualizedCalendar').then((m) => m.VirtualizedCalendar),
    )
  : dynamic(() => import('./DirectCalendar').then((m) => m.DirectCalendar))

const Container = (props) => (
  <div
    css={css`
      margin-top: 24px;
      margin-bottom: 24px;
    `}
    {...props}
  />
)

const screeningMatchesSearch = (
  screening: Screening,
  searchComponents: string[],
) => {
  const title = removeAccents(screening.title.toLowerCase())
  const cinema = removeAccents(screening.cinema.name.toLowerCase())
  const city = removeAccents(screening.cinema.city.name.toLowerCase())

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

  const rows = screeningsByDate
    .map(([date, screenings]) => {
      // filter on text
      const filteredScreenings = screenings?.filter((screening: Screening) =>
        screeningMatchesSearch(screening, searchComponents),
      )

      if (filteredScreenings?.length) {
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

  return (
    <Container>
      <CalendarComponent rows={rows} showCity={showCity} />
    </Container>
  )
}

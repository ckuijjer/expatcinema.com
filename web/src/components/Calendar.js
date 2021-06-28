import React from 'react'
import { DateTime } from 'luxon'
import { AutoSizer, List, WindowScroller } from 'react-virtualized'

import RelativeDate from './RelativeDate'
import Screening from './Screening'
import { useLocalStorage } from '../hooks'
import { useQueryParam, StringParam } from 'use-query-params'
import groupAndSortScreenings from './groupAndSortScreenings'

const flatten = (acc, cur) => [...acc, ...cur]

const Calendar = ({ screenings }) => {
  const [cities] = useLocalStorage('cities', [])
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
          screening.cinema.city.toLowerCase().includes(search.toLowerCase()),
      )
      if (filteredScreenings.length) {
        return [date, filteredScreenings]
      }
      return null
    })
    .filter((x) => x)
    .map(([date, screenings]) => {
      // filter on city
      const filteredScreenings = screenings.filter(
        (screening) =>
          cities.length === 0 || cities.includes(screening.cinema.city),
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

  const renderRow = ({ index, key, style }) => {
    const row = rows[index]

    if (row.component === 'RelativeDate') {
      return (
        <div key={key} style={style} role="row">
          <RelativeDate {...row.props} />
        </div>
      )
    } else {
      return (
        <div key={key} style={style} role="row">
          <Screening {...row.props} />
        </div>
      )
    }
  }

  const getRowHeight = ({ index }) =>
    rows[index].component === 'RelativeDate' ? 60 : 100

  return (
    <WindowScroller serverHeight={1280}>
      {({ height, isScrolling, onChildScroll, scrollTop }) => (
        <AutoSizer style={{ height }} defaultWidth={343}>
          {({ width }) => (
            <List
              autoHeight
              height={height}
              isScrolling={isScrolling}
              onScroll={onChildScroll}
              rowCount={rows.length}
              rowHeight={getRowHeight}
              rowRenderer={renderRow}
              scrollTop={scrollTop}
              width={width}
            />
          )}
        </AutoSizer>
      )}
    </WindowScroller>
  )
}

export default Calendar

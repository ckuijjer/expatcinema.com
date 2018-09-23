import React from 'react'
import { DateTime } from 'luxon'
import { AutoSizer, List, WindowScroller } from 'react-virtualized'

import RelativeDate from './RelativeDate'
import Screening from './Screening'
import screenings from './screenings'

const screeningsByDate = Object.entries(screenings).sort(([a], [b]) => {
  return DateTime.fromISO(a) - DateTime.fromISO(b)
}) // sort by date

const flatten = (acc, cur) => [...acc, ...cur]

const Calendar = ({ cities }) => {
  const rows = screeningsByDate
    .map(([date, screenings]) => {
      const filteredScreenings = screenings.filter(
        screening =>
          cities.length === 0 || cities.includes(screening.cinema.city),
      )
      if (filteredScreenings.length) {
        return [date, filteredScreenings]
      }
    })
    .filter(x => x)
    .map(([date, screenings]) => {
      return [
        { component: 'RelativeDate', props: { children: date } },
        ...screenings.map(screening => ({
          component: 'Screening',
          props: screening,
        })),
      ]
    })
    .reduce(flatten, [])

  // function rowRenderer ({
  //   index,       // Index of row
  //   isScrolling, // The List is currently being scrolled
  //   isVisible,   // This row is visible within the List (eg it is not an overscanned row)
  //   key,         // Unique key within array of rendered rows
  //   parent,      // Reference to the parent List (instance)
  //   style        // Style object to be applied to row (to position it);
  //                // This must be passed through to the rendered row element.
  // }) {
  const renderRow = ({ index, key, style }) => {
    const row = rows[index]

    if (row.component === 'RelativeDate') {
      return (
        <div key={key} style={style}>
          <RelativeDate {...row.props} />
        </div>
      )
    } else {
      return (
        <div key={key} style={style}>
          <Screening {...row.props} />
        </div>
      )
    }
  }

  const getRowHeight = ({ index }) =>
    rows[index].component === 'RelativeDate' ? 60 : 100

  return (
    <WindowScroller>
      {({ height, isScrolling, onChildScroll, scrollTop }) => (
        <AutoSizer style={{ height }}>
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

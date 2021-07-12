import React from 'react'
import { AutoSizer, List, WindowScroller } from 'react-virtualized'
import RelativeDate from '../RelativeDate'
import Screening from '../Screening'

const VirtualizedCalendar = ({ rows }) => {
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

export default VirtualizedCalendar

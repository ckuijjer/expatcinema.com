'use client'

import React from 'react'
import { AutoSizer, List, WindowScroller } from 'react-virtualized'

import type { Row } from '.'
import { RelativeDate } from '../RelativeDate'
import { ScreeningRow } from '../Screening'

export const VirtualizedCalendar = ({
  rows,
  showCity,
}: {
  rows: Row[]
  showCity: boolean
}) => {
  const renderRow = ({
    index,
    key,
    style,
  }: {
    index: number
    key: string
    style: React.CSSProperties
  }) => {
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
          <ScreeningRow {...row.props} showCity={showCity} />
        </div>
      )
    }
  }

  const getRowHeight = ({ index }: { index: number }) =>
    rows[index].component === 'RelativeDate' ? 60 : showCity ? 100 : 78

  return (
    <WindowScroller serverHeight={1280}>
      {({
        height,
        isScrolling,
        onChildScroll,
        scrollTop,
      }: {
        height: number
        isScrolling: boolean
        onChildScroll: (params: { scrollTop: number }) => void
        scrollTop: number
      }) => (
        <AutoSizer style={{ height }} defaultWidth={343}>
          {({ width }: { width: number }) => (
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

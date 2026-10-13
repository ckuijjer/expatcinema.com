import React from 'react'

import type { Row } from '.'
import { RelativeDate } from '../RelativeDate'
import { ScreeningRow } from '../Screening'
import { ScreeningTimeChips } from '../ScreeningTimeChips'

type ScreeningRowData = Extract<Row, { component: 'ScreeningRow' }>['props']

// The rows after a date heading, up to the next heading
const groupByDate = (rows: Row[]) => {
  const groups: { heading: string; screenings: ScreeningRowData[] }[] = []

  for (const row of rows) {
    if (row.component === 'RelativeDate') {
      groups.push({ heading: row.props.children, screenings: [] })
    } else {
      groups.at(-1)?.screenings.push(row.props)
    }
  }

  return groups
}

export const DirectCalendar = ({
  rows,
  showCity,
  showCinema,
  showTitle,
  showPoster,
  runtimeMinutes,
}: {
  rows: Row[]
  showCity: boolean
  showCinema: boolean
  showTitle: boolean
  showPoster: boolean
  runtimeMinutes?: number | null
}) =>
  // with neither the title nor the cinema left, a row would be just a time
  !showTitle && !showCinema ? (
    <>
      {groupByDate(rows).map(({ heading, screenings }) => (
        <React.Fragment key={heading}>
          <RelativeDate>{heading}</RelativeDate>
          <ScreeningTimeChips
            screenings={screenings}
            runtimeMinutes={runtimeMinutes}
          />
        </React.Fragment>
      ))}
    </>
  ) : (
    <>
      {rows.map((row) =>
        row.component === 'RelativeDate' ? (
          <RelativeDate key={row.props.children} {...row.props} />
        ) : (
          <ScreeningRow
            key={`${row.props.url}-${row.props.date.toISO()}-${row.props.title}`}
            {...row.props}
            showCity={showCity}
            showCinema={showCinema}
            showTitle={showTitle}
            showPoster={showPoster}
          />
        ),
      )}
    </>
  )

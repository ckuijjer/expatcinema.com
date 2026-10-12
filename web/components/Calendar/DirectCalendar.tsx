import React from 'react'

import type { Row } from '.'
import { RelativeDate } from '../RelativeDate'
import { ScreeningRow } from '../Screening'

export const DirectCalendar = ({
  rows,
  showCity,
  showCinema,
  showTitle,
  showPoster,
}: {
  rows: Row[]
  showCity: boolean
  showCinema: boolean
  showTitle: boolean
  showPoster: boolean
}) => (
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

import React from 'react'

import type { Row } from '.'
import { RelativeDate } from '../RelativeDate'
import { ScreeningRow } from '../Screening'

export const DirectCalendar = ({
  rows,
  showCity,
  currentCity,
  currentCinema,
}: {
  rows: Row[]
  showCity: boolean
  currentCity?: string
  currentCinema?: string
}) => (
  <>
    {rows.map((row, i) =>
      row.component === 'RelativeDate' ? (
        <RelativeDate key={i} {...row.props} />
      ) : (
        <ScreeningRow
          key={i}
          {...row.props}
          showCity={showCity}
          currentCity={currentCity}
          currentCinema={currentCinema}
        />
      ),
    )}
  </>
)

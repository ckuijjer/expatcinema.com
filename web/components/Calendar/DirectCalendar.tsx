import React from 'react'

import type { Row } from '.'
import { RelativeDate } from '../RelativeDate'
import { ScreeningRow } from '../Screening'

export const DirectCalendar = ({
  rows,
  showCity,
  showPoster,
}: {
  rows: Row[]
  showCity: boolean
  showPoster: boolean
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
          showPoster={showPoster}
        />
      ),
    )}
  </>
)

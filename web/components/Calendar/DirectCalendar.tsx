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
    {rows.map((row) =>
      row.component === 'RelativeDate' ? (
        <RelativeDate key={row.props.children} {...row.props} />
      ) : (
        <ScreeningRow
          key={`${row.props.url}-${row.props.date.toISO()}-${row.props.title}`}
          {...row.props}
          showCity={showCity}
          showPoster={showPoster}
        />
      ),
    )}
  </>
)

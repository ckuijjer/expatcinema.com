import React from 'react'

import { RelativeDate } from '../RelativeDate'
import { Screening } from '../Screening'

export const DirectCalendar = ({ rows, showCity }) => (
  <>
    {rows.map((row, i) =>
      row.component === 'RelativeDate' ? (
        <RelativeDate key={i} {...row.props} />
      ) : (
        <Screening key={i} {...row.props} showCity={showCity} />
      ),
    )}
  </>
)

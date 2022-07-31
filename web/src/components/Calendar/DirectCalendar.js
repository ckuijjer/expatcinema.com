import React from 'react'
import hash from 'object-hash'

import RelativeDate from '../RelativeDate'
import Screening from '../Screening'

const DirectCalendar = ({ rows, showCity }) => (
  <>
    {rows.map((row) => {
      const key = hash(row)

      return row.component === 'RelativeDate' ? (
        <RelativeDate {...row.props} key={key} />
      ) : (
        <Screening {...row.props} showCity={showCity} key={key} />
      )
    })}
  </>
)

export default DirectCalendar

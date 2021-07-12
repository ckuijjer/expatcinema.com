import React from 'react'
import RelativeDate from '../RelativeDate'
import Screening from '../Screening'

const DirectCalendar = ({ rows, showCity }) => {
  return (
    <>
      {rows.map((row, i) =>
        row.component === 'RelativeDate' ? (
          <RelativeDate {...row.props} key={i} />
        ) : (
          <Screening {...row.props} showCity={showCity} key={i} />
        ),
      )}
    </>
  )
}

export default DirectCalendar

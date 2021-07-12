import React from 'react'
import RelativeDate from '../RelativeDate'
import Screening from '../Screening'

const VirtualizedCalendar = ({ rows }) => {
  return (
    <>
      {rows.map((row, i) =>
        row.component === 'RelativeDate' ? (
          <RelativeDate {...row.props} />
        ) : (
          <Screening {...row.props} />
        ),
      )}
    </>
  )
}

export default VirtualizedCalendar

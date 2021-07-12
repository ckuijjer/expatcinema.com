import React from 'react'
import RelativeDate from '../RelativeDate'
import Screening from '../Screening'

const DirectCalendar = ({ rows, showCity }) => {
  return (
    <>
      {rows.map((row) =>
        row.component === 'RelativeDate' ? (
          <RelativeDate {...row.props} />
        ) : (
          <Screening {...row.props} showCity={showCity} />
        ),
      )}
    </>
  )
}

export default DirectCalendar

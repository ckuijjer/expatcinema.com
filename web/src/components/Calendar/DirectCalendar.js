import React from 'react'
import RelativeDate from '../RelativeDate'
import Screening from '../Screening'

const DirectCalendar = ({ rows }) => {
  return (
    <>
      {rows.map((row) =>
        row.component === 'RelativeDate' ? (
          <RelativeDate {...row.props} />
        ) : (
          <Screening {...row.props} />
        ),
      )}
    </>
  )
}

export default DirectCalendar

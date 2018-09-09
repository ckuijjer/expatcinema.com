import React from 'react'
import { DateTime } from 'luxon'
import JSONStringify from './JSONStringify'
import Log from './Log'

import { screenings } from './data'

const Calendar = () => {
  // sort the screenings by date, then render
  const enhancedScreenings = screenings
    .map(x => ({ ...x, date: DateTime.fromISO(x.date) })) // use luxon on the date
    .sort((a, b) => a.date - b.date) // sort by date ascending

  return <JSONStringify>{{ screenings, enhancedScreenings }}</JSONStringify>
}

export default Calendar

import React from 'react'
import { DateTime } from 'luxon'
import styled from 'react-emotion'
import { groupBy } from 'ramda'
import JSONStringify from './JSONStringify'
import { screenings } from './data'

const Screening = styled('div')({
  display: 'grid',
  gridTemplateColumns: '[time] 60px [rest] auto',
  gridColumnGap: 12,
  marginBottom: 20,
})

const Time = styled('div')({
  fontSize: 20,
})

const Title = styled('div')({
  fontSize: 20,
})

const Cinema = styled('div')({
  fontSize: 20,
  gridColumnStart: 'rest',
})

// sort the screenings by date and time
// group by date
// inject some dates? e.g. the coming week? by doing an intersection with a static list of coming days?
const groupByDate = groupBy(screening => screening.date.toISODate())

const groupedScreenings = groupByDate(
  screenings
    .map(x => ({ ...x, date: DateTime.fromISO(x.date) })) // use luxon on the date
    .sort((a, b) => a.date - b.date),
) // sort by date ascending

const Calendar = () => (
  <>
    {Object.entries(groupedScreenings).map(([date, screenings]) => (
      <>
        <h3>{date}</h3>
        {screenings.map(screening => (
          <Screening>
            <Time>
              {screening.date
                .setLocale('en-GB')
                .toLocaleString(DateTime.TIME_24_SIMPLE)}
            </Time>
            <Title>{screening.title}</Title>
            <Cinema>{screening.cinema}</Cinema>
          </Screening>
        ))}
      </>
    ))}
    {/* <JSONStringify>{{ screenings, groupedScreenings }}</JSONStringify> */}
  </>
)

export default Calendar

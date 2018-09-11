import React from 'react'
import { DateTime } from 'luxon'
import styled from 'react-emotion'
import { groupBy } from 'ramda'
import JSONStringify from './JSONStringify'
import Log from './Log'
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
// has to be a string, not a DateTime object, as keys to an Object (e.g. groupedScreenings) have to be a string
const groupByDate = groupBy(screening => screening.date.toISODate())

const groupedScreenings = groupByDate(
  screenings
    .map(x => ({ ...x, date: DateTime.fromISO(x.date) })) // use luxon on the date
    .sort((a, b) => a.date - b.date),
) // sort by date ascending

// todo: this should be easier
const getToday = () => {
  const { year, month, day } = DateTime.fromMillis(Date.now())
  return DateTime.fromObject({ year, month, day })
}

const RelativeDate = ({ children }) => {
  const date = DateTime.fromISO(children)
  const today = getToday()

  const diff = date.diff(today, 'days').values.days

  // today
  // tomorrow
  // thursday ... wednesday
  // thursday 20 september
  let relativeDate = date.toFormat('EEEE d MMMM')
  if (diff < 7) {
    if (diff === 0) {
      relativeDate = 'Today'
    } else if (diff === 1) {
      relativeDate = 'Tomorrow'
    } else {
      relativeDate = date.toFormat('EEEE')
    }
  }

  return <h3>{relativeDate}</h3>
}

const Calendar = () => (
  <>
    {Object.entries(groupedScreenings).map(([date, screenings]) => (
      <>
        <RelativeDate>{date}</RelativeDate>
        {screenings.map(screening => (
          <a href={screening.url}>
            <Screening>
              <Time>
                {screening.date
                  .setLocale('en-GB')
                  .toLocaleString(DateTime.TIME_24_SIMPLE)}
              </Time>
              <Title>{screening.title}</Title>
              <Cinema>{screening.cinema}</Cinema>
            </Screening>
          </a>
        ))}
      </>
    ))}
    {/* <JSONStringify>{{ screenings, groupedScreenings }}</JSONStringify> */}
  </>
)

export default Calendar

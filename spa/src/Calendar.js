import React from 'react'
import { DateTime } from 'luxon'
import styled from 'react-emotion'
import { groupBy } from 'ramda'
import JSONStringify from './JSONStringify'
import { screenings } from './data'
import RelativeDate from './RelativeDate'
import getToday from './getToday'

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
    .filter(x => x.date >= getToday())
    .sort((a, b) => a.date - b.date),
) // sort by date ascending

const A = styled('a')({
  display: 'block',
  textDecoration: 'none',
  color: '#333',

  ':hover': {
    textDecoration: 'underline',
  },
})

const Calendar = () => (
  <>
    {Object.entries(groupedScreenings).map(([date, screenings]) => (
      <>
        <section>
          <RelativeDate>{date}</RelativeDate>
          {screenings.map(screening => (
            <A href={screening.url}>
              <Screening>
                <Time>
                  {screening.date
                    .setLocale('en-GB')
                    .toLocaleString(DateTime.TIME_24_SIMPLE)}
                </Time>
                <Title>{screening.title}</Title>
                <Cinema>{screening.cinema}</Cinema>
              </Screening>
            </A>
          ))}
        </section>
      </>
    ))}
    {/* <JSONStringify>{{ screenings, groupedScreenings }}</JSONStringify> */}
  </>
)

export default Calendar

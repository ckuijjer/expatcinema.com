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
  lineHeight: 1.4,
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

// Add the days in the next week that don't have a screening
const thisWeek = Array(7)
  .fill()
  .map((x, i) =>
    getToday()
      .plus({ days: i })
      .toISODate(),
  )
  .forEach(date => {
    if (!groupedScreenings[date]) {
      groupedScreenings[date] = []
    }
  })

const A = styled('a')({
  display: 'block',
  textDecoration: 'none',
  color: '#333',

  ':hover': {
    textDecoration: 'underline',
  },
})

const DaySection = styled('div')({
  marginBottom: 40,
})

const Calendar = () => (
  <>
    {Object.entries(groupedScreenings)
      .sort(([a], [b]) => {
        return DateTime.fromISO(a) - DateTime.fromISO(b)
      }) // sort by date
      .map(([date, screenings]) => (
        <DaySection key={date}>
          <RelativeDate>{date}</RelativeDate>
          {screenings.length ? (
            screenings.map(screening => (
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
            ))
          ) : (
            <i>No movies found</i>
          )}
        </DaySection>
      ))}
    {/* <JSONStringify>{{ screenings, groupedScreenings }}</JSONStringify> */}
  </>
)

export default Calendar

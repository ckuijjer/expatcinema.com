import React from 'react'
import { DateTime } from 'luxon'
import styled from 'react-emotion'

import JSONStringify from './JSONStringify'
import RelativeDate from './RelativeDate'
import Time from './Time'
import screenings from './screenings'

const Screening = styled('div')({
  display: 'grid',
  gridTemplateColumns: '[time] 60px [rest] auto',
  gridColumnGap: 12,
  lineHeight: 1.4,
  padding: 10,
})

const Title = styled('div')({
  fontSize: 20,
})

const Cinema = styled('div')({
  fontSize: 16,
  gridColumnStart: 'rest',
  color: '#777',
})

const A = styled('a')({
  display: 'block',
  textDecoration: 'none',
  color: '#333',
  marginLeft: -10,
  marginRight: -10,

  ':hover': {
    backgroundColor: '#f6f6f6',
    borderRadius: 10,
  },
})

const DaySection = styled('div')({
  marginBottom: 40,
})

const screeningsByDate = Object.entries(screenings).sort(([a], [b]) => {
  return DateTime.fromISO(a) - DateTime.fromISO(b)
}) // sort by date

const Calendar = ({ cities }) => (
  <>
    {screeningsByDate.map(([date, screenings]) => {
      const filteredScreenings = screenings.filter(
        screening =>
          cities.length === 0 || cities.includes(screening.cinema.city),
      )

      if (filteredScreenings.length) {
        return (
          <DaySection key={date}>
            <RelativeDate>{date}</RelativeDate>
            {filteredScreenings.map(screening => (
              <A href={screening.url}>
                <Screening>
                  <Time>{screening.date}</Time>
                  <Title>{screening.title}</Title>
                  <Cinema>
                    {screening.cinema.name}
                    <br />
                    {screening.cinema.city}
                  </Cinema>
                </Screening>
              </A>
            ))}
          </DaySection>
        )
      } else {
        return null
      }
    })}
  </>
)

export default Calendar

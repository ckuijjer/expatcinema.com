import React from 'react'
import { DateTime } from 'luxon'
import styled from 'react-emotion'
import JSONStringify from './JSONStringify'
import RelativeDate from './RelativeDate'
import screenings from './screenings'

const Screening = styled('div')({
  display: 'grid',
  gridTemplateColumns: '[time] 60px [rest] auto',
  gridColumnGap: 12,
  lineHeight: 1.4,
  padding: 10,
})

const Time = styled('div')({
  fontSize: 20,
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

const NoMoviesFoundToday = () => <i>No movies found</i>

const Calendar = () => (
  <>
    {Object.entries(screenings)
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
                  <Cinema>
                    {screening.cinema.name}
                    <br />
                    {screening.cinema.city}
                  </Cinema>
                </Screening>
              </A>
            ))
          ) : (
            <NoMoviesFoundToday />
          )}
        </DaySection>
      ))}
  </>
)

export default Calendar

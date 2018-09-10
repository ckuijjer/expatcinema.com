import React from 'react'
import { DateTime } from 'luxon'
import styled from 'react-emotion'
import JSONStringify from './JSONStringify'
import { screenings } from './data'

const Screening = styled('div')({})

const Time = styled('div')({
  fontSize: 24,
})

const Title = styled('div')({
  fontSize: 24,
})

const Cinema = styled('div')({
  fontSize: 24,
})

// sort the screenings by date, then render
const enhancedScreenings = screenings
  .map(x => ({ ...x, date: DateTime.fromISO(x.date) })) // use luxon on the date
  .sort((a, b) => a.date - b.date) // sort by date ascending

const Calendar = () => (
  <>
    {enhancedScreenings.map(screening => (
      <Screening>
        <Time>{screening.date.toLocaleString(DateTime.TIME_24_SIMPLE)}</Time>
        <Title>{screening.title}</Title>
        <Cinema>{screening.cinema}</Cinema>
      </Screening>
    ))}
    <JSONStringify>{{ screenings, enhancedScreenings }}</JSONStringify>
  </>
)

export default Calendar

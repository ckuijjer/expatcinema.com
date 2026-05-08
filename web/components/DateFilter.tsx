'use client'

import { DateTime } from 'luxon'
import { useRef } from 'react'

import { css } from 'styled-system/css'

import { getToday } from '../utils/getToday'
import { useScrollFade } from '../utils/hooks'
import { Container, FilterBarWrapper } from './CityFilter'

const linkStyle = css({
  display: 'inline-flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: '8px 10px',
  marginTop: '6px',
  marginBottom: '6px',
  cursor: 'pointer',
  textDecoration: 'none',
  borderRadius: '4px',
  color: 'var(--palette-purple-500)',
  lineHeight: '1.2',
  '&:hover': {
    opacity: '0.75',
  },
})

const labelStyle = css({
  fontSize: '12px',
})

const dayStyle = css({
  fontSize: '20px',
})

const ellipsisStyle = css({
  fontSize: '20px',
  display: 'inline-flex',
  alignItems: 'center',
  padding: '8px 10px',
  marginTop: '6px',
  marginBottom: '6px',
  cursor: 'pointer',
  textDecoration: 'none',
  color: 'var(--palette-purple-500)',
  '&:hover': {
    opacity: '0.75',
  },
})

const MAX_DAYS = 7

type DateParts = { top: string; day: string; month: string }

const getDateParts = (isoDate: string, today: DateTime): DateParts => {
  const date = DateTime.fromISO(isoDate, { zone: 'Europe/Amsterdam' })
  const diff = date.diff(today, 'days').days
  const top = diff === 0 ? 'Today' : diff === 1 ? 'Tomorrow' : date.toFormat('EEEE')
  return { top, day: date.toFormat('d'), month: date.toFormat('MMM') }
}

export const DateFilter = ({ dates }: { dates: string[] }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const showFade = useScrollFade(containerRef)
  const today = getToday()

  const visibleDates = dates.filter((d) => {
    const diff = DateTime.fromISO(d, { zone: 'Europe/Amsterdam' }).diff(today, 'days').days
    return diff >= 0 && diff < MAX_DAYS
  })
  const firstExtraDate = dates[visibleDates.length]

  return (
    <FilterBarWrapper
      fadeColor="var(--palette-purple-200)"
      textColor="var(--palette-purple-500)"
      showFade={showFade}
    >
      <Container
        ref={containerRef}
        className={css({
          display: 'flex',
          backgroundColor: 'var(--palette-purple-200)',
          gap: '4px',
        })}
      >
        {visibleDates.map((isoDate) => {
          const { top, day, month } = getDateParts(isoDate, today)
          return (
            <a key={isoDate} href={`#${isoDate}`} className={linkStyle}>
              <span className={labelStyle}>{top}</span>
              <span className={dayStyle}>{day}</span>
              <span className={labelStyle}>{month}</span>
            </a>
          )
        })}
        {firstExtraDate && (
          <a href={`#${firstExtraDate}`} className={ellipsisStyle}>
            …
          </a>
        )}
      </Container>
    </FilterBarWrapper>
  )
}

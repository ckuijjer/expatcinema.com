'use client'

import { DateTime } from 'luxon'

import { css } from 'styled-system/css'

import { getToday } from '../utils/getToday'

const gridStyle = css({
  display: 'grid',
  gridTemplateColumns: 'repeat(8, 1fr)',
  backgroundColor: 'var(--palette-purple-200)',
})

const linkStyle = css({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '4px 0',
  cursor: 'pointer',
  textDecoration: 'none',
  color: 'var(--palette-purple-500)',
  lineHeight: '1.2',
  '&:hover': {
    opacity: '0.75',
  },
})

const labelStyle = css({
  fontSize: '10px',
})

const dayStyle = css({
  fontSize: '15px',
})

const MAX_DAYS = 7

const getDateParts = (isoDate: string, today: DateTime) => {
  const date = DateTime.fromISO(isoDate, { zone: 'Europe/Amsterdam' })
  const diff = date.diff(today, 'days').days
  const label = diff === 0 ? 'Today' : diff === 1 ? 'Tomorrow' : date.toFormat('EEE')
  return { label, day: date.toFormat('d') }
}

export const DateFilter = ({ dates }: { dates: string[] }) => {
  const today = getToday()

  const visibleDates = dates.filter((d) => {
    const diff = DateTime.fromISO(d, { zone: 'Europe/Amsterdam' }).diff(today, 'days').days
    return diff >= 0 && diff < MAX_DAYS
  })
  const firstExtraDate = dates[visibleDates.length]

  return (
    <div className={gridStyle}>
      {visibleDates.map((isoDate) => {
        const { label, day } = getDateParts(isoDate, today)
        return (
          <a key={isoDate} href={`#${isoDate}`} className={linkStyle}>
            <span className={labelStyle}>{label}</span>
            <span className={dayStyle}>{day}</span>
          </a>
        )
      })}
      {firstExtraDate ? (
        <a href={`#${firstExtraDate}`} className={linkStyle}>
          <span className={dayStyle}>…</span>
        </a>
      ) : (
        <div />
      )}
    </div>
  )
}

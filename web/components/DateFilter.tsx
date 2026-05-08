'use client'

import { DateTime } from 'luxon'

import { css, cx } from 'styled-system/css'

import { getToday } from '../utils/getToday'

const gridStyle = css({
  display: 'grid',
  gridTemplateColumns: 'repeat(8, 1fr)',
  backgroundColor: 'var(--palette-purple-200)',
  gap: '8px 6px',
  padding: '8px 3px',
})

const linkStyle = css({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '4px 4px',
  cursor: 'pointer',
  textDecoration: 'none',
  color: 'var(--palette-purple-500)',
  lineHeight: '1.2',
  backgroundColor: 'white',
  border: '1px solid var(--palette-purple-300)',
  borderRadius: '6px',
  '&:hover': {
    opacity: '0.75',
  },
})

const disabledStyle = css({
  opacity: '0.35',
  cursor: 'default',
  pointerEvents: 'none',
})

const labelStyle = css({
  fontSize: '10px',
})

const dayStyle = css({
  fontSize: '18px',
})

const MAX_DAYS = 7

const getDateParts = (date: DateTime, today: DateTime) => {
  const diff = date.diff(today, 'days').days
  const label = diff === 0 ? 'Today' : diff === 1 ? 'Tomorrow' : date.toFormat('EEE')
  return { label, day: date.toFormat('d') }
}

export const DateFilter = ({ dates }: { dates: string[] }) => {
  const today = getToday()
  const activeDates = new Set(dates)

  const window = Array.from({ length: MAX_DAYS }, (_, i) => today.plus({ days: i }))

  const firstExtraDate = dates.find((d) => {
    const diff = DateTime.fromISO(d, { zone: 'Europe/Amsterdam' }).diff(today, 'days').days
    return diff >= MAX_DAYS
  })

  return (
    <div className={gridStyle}>
      {window.map((date) => {
        const isoDate = date.toISODate()!
        const { label, day } = getDateParts(date, today)
        const active = activeDates.has(isoDate)
        return active ? (
          <a key={isoDate} href={`#${isoDate}`} className={linkStyle}>
            <span className={labelStyle}>{label}</span>
            <span className={dayStyle}>{day}</span>
          </a>
        ) : (
          <div key={isoDate} className={cx(linkStyle, disabledStyle)}>
            <span className={labelStyle}>{label}</span>
            <span className={dayStyle}>{day}</span>
          </div>
        )
      })}
      {firstExtraDate ? (
        <a href={`#${firstExtraDate}`} className={linkStyle}>
          <span className={dayStyle}>…</span>
        </a>
      ) : (
        <div className={cx(linkStyle, disabledStyle)}>
          <span className={dayStyle}>…</span>
        </div>
      )}
    </div>
  )
}

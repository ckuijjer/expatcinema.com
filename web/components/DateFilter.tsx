'use client'

import { DateTime } from 'luxon'
import { useRef } from 'react'

import { css } from 'styled-system/css'

import { getToday } from '../utils/getToday'
import { useScrollFade } from '../utils/hooks'
import { Container, FilterBarWrapper } from './CityFilter'

const linkStyle = css({
  display: 'inline-block',
  fontSize: '18px',
  padding: '10px',
  marginTop: '8px',
  marginBottom: '8px',
  cursor: 'pointer',
  textDecoration: 'none',
  borderRadius: '4px',
  color: 'var(--palette-purple-500)',
  whiteSpace: 'nowrap',
  '&:hover': {
    opacity: '0.75',
  },
})

const MAX_DAYS = 7

const getLabel = (isoDate: string, today: DateTime): string => {
  const date = DateTime.fromISO(isoDate, { zone: 'Europe/Amsterdam' })
  const diff = date.diff(today, 'days').days
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  return date.toFormat('d MMM')
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
          gap: '12px',
        })}
      >
        {visibleDates.map((isoDate) => (
          <a key={isoDate} href={`#${isoDate}`} className={linkStyle}>
            {getLabel(isoDate, today)}
          </a>
        ))}
        {firstExtraDate && (
          <a href={`#${firstExtraDate}`} className={linkStyle}>
            …
          </a>
        )}
      </Container>
    </FilterBarWrapper>
  )
}

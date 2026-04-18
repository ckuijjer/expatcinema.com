'use client'

import { useRouter } from 'next/navigation'
import React from 'react'

import { css } from 'styled-system/css'

import { getMoviePagePath } from '../utils/getMoviePagePath'
import type { Screening } from '../utils/getScreenings'

type SelectOption = {
  label: string
  slug: string
}

const filtersStyle = css({
  display: 'grid',
  gap: '12px',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  '@media (max-width: 640px)': {
    gridTemplateColumns: 'minmax(0, 1fr)',
  },
})

const selectWrapStyle = css({
  position: 'relative',
})

const selectStyle = css({
  width: '100%',
  minWidth: '0',
  height: '40px',
  padding: '0 44px 0 14px',
  borderRadius: '10px',
  border: '2px solid var(--secondary-color)',
  backgroundColor: 'var(--primary-color)',
  color: 'var(--secondary-color)',
  fontSize: '18px',
  lineHeight: '1.4',
  outline: 'none',
  appearance: 'none',
  WebkitAppearance: 'none',
  '&:focus': {
    boxShadow:
      '0 0 0 2px color-mix(in srgb, var(--secondary-color) 25%, transparent)',
  },
})

const arrowStyle = css({
  position: 'absolute',
  right: '14px',
  top: '50%',
  transform: 'translateY(-50%)',
  pointerEvents: 'none',
  color: 'var(--secondary-color)',
  fontSize: '16px',
  lineHeight: '1',
})

const sortOptions = (left: SelectOption, right: SelectOption) =>
  left.label.localeCompare(right.label, undefined, { sensitivity: 'base' })

const getUniqueCityOptions = (screenings: Screening[]) =>
  Array.from(
    new Map(
      screenings.map((screening) => [
        screening.cinema.city.slug,
        {
          slug: screening.cinema.city.slug,
          label: screening.cinema.city.name,
        },
      ]),
    ).values(),
  ).sort(sortOptions)

const getUniqueCinemaOptions = (screenings: Screening[]) =>
  Array.from(
    new Map(
      screenings.map((screening) => [
        screening.cinema.slug,
        {
          slug: screening.cinema.slug,
          label: screening.cinema.name,
        },
      ]),
    ).values(),
  ).sort(sortOptions)

const getCityForCinema = (screenings: Screening[], cinemaSlug: string) =>
  screenings.find((screening) => screening.cinema.slug === cinemaSlug)?.cinema
    .city.slug

export const MovieLocationFilters = ({
  movieSlug,
  screenings,
  currentCity,
  currentCinema,
}: {
  movieSlug: string
  screenings: Screening[]
  currentCity?: string
  currentCinema?: string
}) => {
  const router = useRouter()
  const cityOptions = getUniqueCityOptions(screenings)
  const cinemaOptions = getUniqueCinemaOptions(
    currentCity
      ? screenings.filter(
          (screening) => screening.cinema.city.slug === currentCity,
        )
      : screenings,
  )

  const citySelectValue = currentCity ?? ''
  const cinemaSelectValue = currentCinema ?? ''

  const navigateTo = (city?: string, cinema?: string) => {
    router.push(getMoviePagePath(movieSlug, city ?? null, cinema ?? null))
  }

  return (
    <div className={filtersStyle}>
      <div className={selectWrapStyle}>
        <select
          className={selectStyle}
          aria-label="City filter"
          value={citySelectValue}
          onChange={(event) => {
            const nextCity = event.target.value || undefined
            navigateTo(nextCity, undefined)
          }}
        >
          <option value="">All Cities</option>
          {cityOptions.map((option) => (
            <option key={option.slug} value={option.slug}>
              {option.label}
            </option>
          ))}
        </select>
        <span className={arrowStyle} aria-hidden>
          ▾
        </span>
      </div>
      <div className={selectWrapStyle}>
        <select
          className={selectStyle}
          aria-label="Cinema filter"
          value={cinemaSelectValue}
          onChange={(event) => {
            const nextCinema = event.target.value || undefined
            if (!nextCinema) {
              navigateTo(currentCity, undefined)
              return
            }

            const nextCity =
              getCityForCinema(screenings, nextCinema) ??
              currentCity ??
              undefined
            navigateTo(nextCity, nextCinema)
          }}
        >
          <option value="">All Cinemas</option>
          {cinemaOptions.map((option) => (
            <option key={option.slug} value={option.slug}>
              {option.label}
            </option>
          ))}
        </select>
        <span className={arrowStyle} aria-hidden>
          ▾
        </span>
      </div>
    </div>
  )
}

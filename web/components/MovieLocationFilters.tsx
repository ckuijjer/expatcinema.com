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

const filterStyle = css({
  display: 'grid',
  gap: '6px',
})

const labelStyle = css({
  fontSize: '14px',
  fontWeight: '700',
  color: 'var(--text-color)',
})

const selectStyle = css({
  width: '100%',
  minWidth: '0',
  padding: '10px 12px',
  borderRadius: '10px',
  border: '1px solid var(--border-color)',
  backgroundColor: 'var(--background-color)',
  color: 'var(--text-color)',
  fontSize: '16px',
  lineHeight: '1.4',
  outline: 'none',
  '&:focus': {
    borderColor: 'var(--secondary-color)',
    boxShadow:
      '0 0 0 2px color-mix(in srgb, var(--secondary-color) 25%, transparent)',
  },
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
      <label className={filterStyle}>
        <span className={labelStyle}>City</span>
        <select
          className={selectStyle}
          value={citySelectValue}
          onChange={(event) => {
            const nextCity = event.target.value || undefined
            navigateTo(nextCity, undefined)
          }}
        >
          <option value="">All</option>
          {cityOptions.map((option) => (
            <option key={option.slug} value={option.slug}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <label className={filterStyle}>
        <span className={labelStyle}>Cinema</span>
        <select
          className={selectStyle}
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
          <option value="">All</option>
          {cinemaOptions.map((option) => (
            <option key={option.slug} value={option.slug}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  )
}

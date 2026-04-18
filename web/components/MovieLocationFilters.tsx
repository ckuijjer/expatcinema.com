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
})

const selectStyle = css({
  width: '100%',
  minWidth: '0',
  padding: '12px 14px',
  borderRadius: '10px',
  border: '2px solid var(--background-inverse-color)',
  backgroundColor: 'transparent',
  color: 'var(--text-inverse-color)',
  fontSize: '18px',
  lineHeight: '1.4',
  outline: 'none',
  '&:focus': {
    boxShadow:
      '0 0 0 2px color-mix(in srgb, var(--background-inverse-color) 25%, transparent)',
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
            getCityForCinema(screenings, nextCinema) ?? currentCity ?? undefined
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
    </div>
  )
}

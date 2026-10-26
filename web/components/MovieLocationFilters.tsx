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
  height: '44px',
  padding: '0 40px 0 14px',
  borderRadius: '8px',
  // at least 3:1 against the background, in both themes
  border: '1px solid var(--text-subtle-color)',
  backgroundColor: 'var(--background-color)',
  color: 'var(--text-color)',
  fontFamily: 'inherit',
  fontSize: '16px',
  cursor: 'pointer',
  appearance: 'none',
  WebkitAppearance: 'none',
  textOverflow: 'ellipsis',
  '&:hover': {
    borderColor: 'var(--text-color)',
  },
  '&:focus-visible': {
    outline: '2px solid var(--secondary-color)',
    outlineOffset: '2px',
  },
  // a filter that is applied gets the accent color, like a selected tab
  '&[data-active="true"]': {
    borderColor: 'var(--secondary-color)',
    boxShadow: 'inset 0 0 0 1px var(--secondary-color)',
  },
  '@media (prefers-color-scheme: dark)': {
    '&:focus-visible': { outlineColor: 'var(--primary-color)' },
    '&[data-active="true"]': {
      borderColor: 'var(--primary-color)',
      boxShadow: 'inset 0 0 0 1px var(--primary-color)',
    },
  },
})

const chevronStyle = css({
  position: 'absolute',
  right: '14px',
  top: '50%',
  transform: 'translateY(-50%)',
  pointerEvents: 'none',
  color: 'var(--text-muted-color)',
})

const Chevron = () => (
  <svg
    className={chevronStyle}
    width="12"
    height="8"
    viewBox="0 0 12 8"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M1 1.5l5 5 5-5" />
  </svg>
)

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
    router.push(getMoviePagePath(movieSlug, city ?? null, cinema ?? null), {
      scroll: false,
    })
  }

  return (
    <div className={filtersStyle}>
      <div className={selectWrapStyle}>
        <select
          className={selectStyle}
          aria-label="City filter"
          data-active={Boolean(currentCity)}
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
        <Chevron />
      </div>
      <div className={selectWrapStyle}>
        <select
          className={selectStyle}
          aria-label="Cinema filter"
          data-active={Boolean(currentCinema)}
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
        <Chevron />
      </div>
    </div>
  )
}

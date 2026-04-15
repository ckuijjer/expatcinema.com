import { DateTime } from 'luxon'
import Image from 'next/image'
import React from 'react'

import { css } from 'styled-system/css'

import { Cinema } from '../utils/getScreenings'
import { Time } from './Time'

const aStyle = css({
  textDecoration: 'none',
  color: 'var(--text-color)',
})

const linkStyle = css({
  display: 'block',
})

const containerStyle = css({
  display: 'grid',
  gridTemplateColumns: '[time] 60px [text] minmax(0, 1fr) [poster] auto',
  gridColumnGap: '12px',
  lineHeight: '1.5',
  padding: '12px',
  alignItems: 'center',
  minHeight: '72px',
  marginLeft: '-12px',
  marginRight: '-12px',
  _hover: {
    backgroundColor: 'var(--background-highlight-color)',
    borderRadius: '10px',
  },
})

const titleStyle = css({
  fontSize: '18px',
  whiteSpace: 'nowrap',
  textOverflow: 'ellipsis',
  overflow: 'hidden',
})

const titleYearStyle = css({
  color: 'color-mix(in srgb, var(--text-color) 35%, transparent)',
})

const cinemaInfoStyle = css({
  fontSize: '14px',
  color: 'var(--text-muted-color)',
  display: 'flex',
  alignItems: 'center',
})

const posterStyle = css({
  gridColumnStart: 'poster',
  gridRow: '1 / span 2',
  width: '48px',
  height: '72px',
  borderRadius: '4px',
  objectFit: 'cover',
})

const posterPlaceholderStyle = css({
  gridColumnStart: 'poster',
  gridRow: '1 / span 2',
  width: '48px',
  height: '72px',
  borderRadius: '4px',
  backgroundColor: 'var(--background-highlight-color)',
  border: '1px solid var(--border-color)',
})

const posterLinkStyle = css({
  gridColumnStart: 'poster',
  gridRow: '1 / span 2',
  display: 'block',
  width: '48px',
  height: '72px',
})

const textContentStyle = css({
  gridColumn: 'text',
  display: 'grid',
  rowGap: '0',
  minWidth: '0',
})

const timeRowStyle = css({
  display: 'grid',
  gridTemplateColumns: '[time] 60px [text] minmax(0, 1fr)',
  columnGap: '12px',
  alignItems: 'center',
})

const cinemaIconStyle = css({
  filter: 'grayscale(100%) opacity(0.5)',
  marginRight: '4px',
  display: 'inline',
})

type CinemaIconProps = {
  cinema: Cinema
}

const CinemaIcon = ({ cinema }: CinemaIconProps) => {
  if (!cinema.logo) {
    return null
  }

  return (
    <Image
      src={`/images/${cinema.logo}`}
      width={16}
      height={16}
      alt={`Logo for ${cinema.name}`}
      className={cinemaIconStyle}
    />
  )
}

export const ScreeningRow = ({
  url,
  date,
  title,
  year,
  cinema,
  movieId,
  movieSlug,
  posterUrl,
  showCity = true,
  currentCity,
  currentCinema,
}: {
  url: string
  date: DateTime
  title: string
  year?: number
  cinema: Cinema
  movieId?: string
  movieSlug?: string
  posterUrl?: string
  showCity?: boolean
  currentCity?: string
  currentCinema?: string
}) => {
  const movieIdClassName = movieId
    ? `movie-id-${movieId.replace(/[^a-zA-Z0-9_-]/g, '-')}`
    : undefined
  const movieUrl = movieSlug
    ? currentCity && currentCinema
      ? `/city/${currentCity}/cinema/${currentCinema}/movie/${movieSlug}`
      : currentCity
        ? `/city/${currentCity}/movie/${movieSlug}`
        : `/movie/${movieSlug}`
    : url

  return (
    <div className={movieIdClassName}>
      <div className={containerStyle}>
        <a href={url} className={`${aStyle} ${linkStyle} ${timeRowStyle}`}>
          <Time>{date}</Time>
          <div className={textContentStyle}>
            <div className={titleStyle}>
              {title}
              {year ? <span className={titleYearStyle}> ({year})</span> : null}
            </div>
            <div className={cinemaInfoStyle}>
              <CinemaIcon cinema={cinema} />
              {cinema.name}
              {showCity ? <> | {cinema.city.name}</> : null}
            </div>
          </div>
        </a>
        {posterUrl ? (
          <a href={movieUrl} className={posterLinkStyle}>
            <Image
              src={posterUrl}
              width={48}
              height={72}
              alt=""
              aria-hidden
              className={posterStyle}
            />
          </a>
        ) : movieId ? (
          <div aria-hidden className={posterPlaceholderStyle} />
        ) : null}
      </div>
    </div>
  )
}

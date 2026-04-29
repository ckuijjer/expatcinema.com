import { DateTime } from 'luxon'
import Image from 'next/image'
import React from 'react'

import { css, cx } from 'styled-system/css'

import { Cinema } from '../utils/getScreenings'
import { getMoviePagePath } from '../utils/getMoviePagePath'
import { Time } from './Time'
import {
  listPosterPlaceholderStyle,
  listPosterStyle,
  listRowBaseStyle,
  listTitleStyle,
  listYearStyle,
} from './listStyles'

const containerStyle = cx(
  listRowBaseStyle,
  css({
    position: 'relative',
    display: 'grid',
    gridTemplateColumns: '[time] 60px [rest] minmax(0, 1fr) [poster] auto',
    gridTemplateRows: 'auto auto',
    gridColumnGap: '12px',
  }),
)

const timeStyle = css({
  gridColumnStart: 'time',
  gridRow: '1 / span 2',
  alignSelf: 'start',
  paddingTop: '4px',
  pointerEvents: 'none',
})

const contentStyle = css({
  display: 'contents',
})

const cinemaInfoStyle = css({
  gridColumnStart: 'rest',
  gridRowStart: '2',
  minWidth: '0',
  fontSize: '14px',
  color: 'var(--text-muted-color)',
  display: 'flex',
  alignItems: 'center',
  pointerEvents: 'none',
})

const cinemaIconFrameStyle = css({
  width: '18px',
  height: '18px',
  marginRight: '6px',
  borderRadius: '4px',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: '0',
  overflow: 'hidden',
  backgroundColor: 'var(--text-inverse-color)',
  border: '1px solid var(--border-color)',
})

const cinemaIconStyle = css({
  display: 'block',
})

const posterLinkStyle = css({
  gridRow: '1 / span 2',
  alignSelf: 'start',
  display: 'block',
  width: '48px',
  height: '72px',
  position: 'relative',
  zIndex: '2',
})

const screeningRowLinkStyle = css({
  position: 'absolute',
  inset: '0',
  zIndex: '0',
  display: 'block',
  textDecoration: 'none',
  color: 'var(--text-color)',
})

type CinemaIconProps = {
  cinema: Cinema
}

const CinemaIcon = ({ cinema }: CinemaIconProps) => {
  if (!cinema.logo) {
    return null
  }

  return (
    <span className={cinemaIconFrameStyle}>
      <Image
        src={`/images/${cinema.logo}`}
        width={14}
        height={14}
        alt={`Logo for ${cinema.name}`}
        className={cinemaIconStyle}
      />
    </span>
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
  movieHref,
  posterUrl,
  showCity = true,
  showPoster = true,
}: {
  url: string
  date: DateTime
  title: string
  year?: number
  cinema: Cinema
  movieId?: string
  movieSlug?: string
  movieHref?: string
  posterUrl?: string
  showCity?: boolean
  showPoster?: boolean
}) => {
  const movieIdClassName = movieId
    ? `movie-id-${movieId.replace(/[^a-zA-Z0-9_-]/g, '-')}`
    : undefined
  const tmdbUrl = movieId?.startsWith('tmdb:')
    ? `https://www.themoviedb.org/movie/${movieId.slice(5)}`
    : undefined
  const movieUrl =
    movieHref ?? (movieSlug ? getMoviePagePath(movieSlug) : undefined)

  return (
    <div className={movieIdClassName}>
      <div className={containerStyle}>
        <a
          href={url}
          aria-label={`Open screening for ${title}`}
          className={screeningRowLinkStyle}
        />
        <div className={timeStyle}>
          <Time>{date}</Time>
        </div>
        <div className={contentStyle}>
          <div className={listTitleStyle} style={{ pointerEvents: 'none' }}>
            {title}
            {year ? <span className={listYearStyle}> ({year})</span> : null}
          </div>
          <div className={cinemaInfoStyle}>
            <CinemaIcon cinema={cinema} />
            {cinema.name}
            {showCity ? <> | {cinema.city.name}</> : null}
          </div>
        </div>
        {showPoster && posterUrl && movieUrl ? (
          <a href={movieUrl} className={posterLinkStyle}>
            <Image
              src={posterUrl}
              width={48}
              height={72}
              alt=""
              aria-hidden
              className={listPosterStyle}
            />
          </a>
        ) : showPoster && posterUrl && tmdbUrl ? (
          <a
            href={tmdbUrl}
            target="_blank"
            rel="noreferrer"
            className={posterLinkStyle}
          >
            <Image
              src={posterUrl}
              width={48}
              height={72}
              alt=""
              aria-hidden
              className={listPosterStyle}
            />
          </a>
        ) : showPoster && posterUrl ? (
          <Image
            src={posterUrl}
            width={48}
            height={72}
            alt=""
            aria-hidden
            className={listPosterStyle}
          />
        ) : showPoster ? (
          <div aria-hidden className={listPosterPlaceholderStyle} />
        ) : null}
      </div>
    </div>
  )
}

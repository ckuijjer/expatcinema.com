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

const aStyle = css({
  textDecoration: 'none',
  color: 'var(--text-color)',
})

const containerStyle = cx(
  listRowBaseStyle,
  css({
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
})

const posterLinkStyle = css({
  gridRow: '1 / span 2',
  alignSelf: 'start',
  display: 'block',
  width: '48px',
  height: '72px',
})

const screeningLinkStyle = css({
  textDecoration: 'none',
  color: 'var(--text-color)',
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
          className={`${aStyle} ${screeningLinkStyle} ${timeStyle}`}
        >
          <Time>{date}</Time>
        </a>
        <a
          href={url}
          className={`${aStyle} ${screeningLinkStyle} ${contentStyle}`}
        >
          <div className={listTitleStyle}>
            {title}
            {year ? <span className={listYearStyle}> ({year})</span> : null}
          </div>
          <div className={cinemaInfoStyle}>
            <CinemaIcon cinema={cinema} />
            {cinema.name}
            {showCity ? <> | {cinema.city.name}</> : null}
          </div>
        </a>
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
        ) : showPoster && movieId ? (
          <div aria-hidden className={listPosterPlaceholderStyle} />
        ) : null}
      </div>
    </div>
  )
}

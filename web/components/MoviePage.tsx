import Image from 'next/image'
import React from 'react'
import { Suspense } from 'react'

import { css, cx } from 'styled-system/css'

import { headerFont } from '../utils/theme'
import {
  getMoviePosterUrl,
  getMovieReleaseYear,
  Movie,
} from '../utils/getMovies'
import { Screening } from '../utils/getScreenings'
import { Calendar } from './Calendar'
import { Layout } from './Layout'

const pageStyle = css({
  marginTop: '16px',
  marginBottom: '16px',
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 240px) minmax(0, 1fr)',
  columnGap: '24px',
  rowGap: '16px',
  alignItems: 'start',
  '@media (max-width: 640px)': {
    gridTemplateColumns: 'minmax(0, 1fr)',
  },
})

const posterWrapStyle = css({
  position: 'relative',
  width: '100%',
  maxWidth: '240px',
  aspectRatio: '2 / 3',
  borderRadius: '10px',
  overflow: 'hidden',
  backgroundColor: 'var(--background-highlight-color)',
  border: '1px solid var(--border-color)',
  '@media (max-width: 640px)': {
    maxWidth: '180px',
  },
})

const posterStyle = css({
  objectFit: 'cover',
})

const posterPlaceholderStyle = css({
  width: '100%',
  height: '100%',
  backgroundColor: 'var(--background-highlight-color)',
})

const titleStyle = css({
  marginTop: '0',
  marginBottom: '0',
  fontSize: '44px',
  lineHeight: '1.05',
  '@media (max-width: 640px)': {
    fontSize: '32px',
  },
})

const yearStyle = css({
  color: 'color-mix(in srgb, var(--text-color) 45%, transparent)',
})

const movieInfoStyle = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  minWidth: '0',
})

export const MoviePage = ({
  movie,
  screenings,
  showCity = true,
  currentCity,
  currentCinema,
}: {
  movie: Movie
  screenings: Screening[]
  showCity?: boolean
  currentCity?: string
  currentCinema?: string
}) => {
  const posterUrl = getMoviePosterUrl(movie.tmdb?.posterPath, 'w342')
  const year = getMovieReleaseYear(movie)

  return (
    <Layout>
      <div className={pageStyle}>
        <div className={posterWrapStyle}>
          {posterUrl ? (
            <Image
              src={posterUrl}
              fill
              alt={`Poster for ${movie.title}`}
              className={posterStyle}
              sizes="(max-width: 640px) 180px, 240px"
            />
          ) : (
            <div aria-hidden className={posterPlaceholderStyle} />
          )}
        </div>
        <div className={movieInfoStyle}>
          <h1 className={cx(titleStyle, headerFont.className)}>
            {movie.title}
            {year ? <span className={yearStyle}> ({year})</span> : null}
          </h1>
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <Suspense>
            <Calendar
              screenings={screenings}
              showCity={showCity}
              currentCity={currentCity}
              currentCinema={currentCinema}
            />
          </Suspense>
        </div>
      </div>
    </Layout>
  )
}

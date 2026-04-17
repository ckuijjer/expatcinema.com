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

const detailsStyle = css({
  display: 'grid',
  rowGap: '12px',
  marginTop: '4px',
})

const descriptionStyle = css({
  marginTop: '0',
  marginBottom: '0',
  fontSize: '18px',
  lineHeight: '1.5',
})

const metadataStyle = css({
  display: 'flex',
  flexWrap: 'wrap',
  gap: '16px',
  fontSize: '14px',
  lineHeight: '1.4',
  color: 'var(--text-muted-color)',
})

const metadataItemStyle = css({
  display: 'flex',
  gap: '4px',
})

const metadataLabelStyle = css({
  fontWeight: '700',
  color: 'var(--text-color)',
})

const linkRowStyle = css({
  display: 'flex',
  gap: '12px',
  flexWrap: 'wrap',
})

const externalLinkStyle = css({
  fontSize: '14px',
  color: 'var(--secondary-color)',
  textDecoration: 'none',
  '&:hover': {
    textDecoration: 'underline',
  },
})

const originalLanguageNames = new Intl.DisplayNames(['en'], {
  type: 'language',
})

const formatOriginalLanguage = (language?: string | null) => {
  if (!language) {
    return undefined
  }

  return originalLanguageNames.of(language) ?? language
}

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
  const tmdbHref = movie.tmdb?.id
    ? `https://www.themoviedb.org/movie/${movie.tmdb.id}`
    : undefined
  const imdbHref = movie.imdbId
    ? `https://www.imdb.com/title/${movie.imdbId}/`
    : undefined
  const originalLanguage = formatOriginalLanguage(movie.tmdb?.originalLanguage)
  const runtime = movie.tmdb?.runtime
  const description = movie.tmdb?.overview

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
          {description || originalLanguage || runtime ? (
            <div className={detailsStyle}>
              {description ? (
                <p className={descriptionStyle}>{description}</p>
              ) : null}
              <div className={metadataStyle}>
                {originalLanguage ? (
                  <div className={metadataItemStyle}>
                    <span className={metadataLabelStyle}>
                      Original language:
                    </span>
                    <span>{originalLanguage}</span>
                  </div>
                ) : null}
                {runtime ? (
                  <div className={metadataItemStyle}>
                    <span className={metadataLabelStyle}>Runtime:</span>
                    <span>{runtime} min</span>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}
          <div className={linkRowStyle}>
            {tmdbHref ? (
              <a
                href={tmdbHref}
                target="_blank"
                rel="noreferrer"
                className={externalLinkStyle}
              >
                TMDB
              </a>
            ) : null}
            {imdbHref ? (
              <a
                href={imdbHref}
                target="_blank"
                rel="noreferrer"
                className={externalLinkStyle}
              >
                IMDb
              </a>
            ) : null}
          </div>
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <Suspense>
            <Calendar
              screenings={screenings}
              showCity={showCity}
              showPoster={false}
              currentCity={currentCity}
              currentCinema={currentCinema}
            />
          </Suspense>
        </div>
      </div>
    </Layout>
  )
}

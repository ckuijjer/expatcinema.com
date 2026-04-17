import Image from 'next/image'
import React from 'react'
import { Suspense } from 'react'
import { Duration } from 'luxon'

import { css, cx } from 'styled-system/css'

import { headerFont } from '../utils/theme'
import { getMoviePosterUrl, getMovieReleaseYear } from '../utils/getMovies'
import type { Movie, MovieVideo } from '../utils/getMovies'
import type { Screening } from '../utils/getScreenings'
import { Calendar } from './Calendar'
import { Layout } from './Layout'
import { MovieLocationFilters } from './MovieLocationFilters'
import { PageSection } from './PageSection'

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

const trailerSectionStyle = css({
  display: 'grid',
  rowGap: '12px',
})

const trailerEmbedStyle = css({
  position: 'relative',
  width: '100%',
  aspectRatio: '16 / 9',
  overflow: 'hidden',
  borderRadius: '12px',
  border: '1px solid var(--border-color)',
  backgroundColor: 'var(--background-highlight-color)',
  maxWidth: '960px',
})

const trailerFrameStyle = css({
  position: 'absolute',
  inset: '0',
  width: '100%',
  height: '100%',
  border: '0',
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

const formatRuntime = (runtime?: number | null) => {
  if (!runtime) {
    return undefined
  }

  const balancedDuration = Duration.fromObject({ minutes: runtime }).shiftTo(
    'hours',
    'minutes',
  )

  const parts = []
  if (balancedDuration.hours) {
    parts.push(`${balancedDuration.hours}h`)
  }
  if (balancedDuration.minutes || parts.length === 0) {
    parts.push(`${balancedDuration.minutes}m`)
  }

  return parts.join('')
}

const getTrailer = (movie: Movie) => {
  const videos = movie.tmdb?.videos?.results?.filter(
    (video): video is MovieVideo & { key: string } =>
      video.site === 'YouTube' && Boolean(video.key),
  )

  if (!videos?.length) {
    return undefined
  }

  return (
    videos.find((video) => video.type === 'Trailer' && video.official) ??
    videos.find((video) => video.type === 'Trailer') ??
    videos[0]
  )
}

export const MoviePage = ({
  movie,
  movieSlug,
  screenings,
  availableScreenings,
  showCity = true,
  currentCity,
  currentCinema,
}: {
  movie: Movie
  movieSlug: string
  screenings: Screening[]
  availableScreenings: Screening[]
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
  const runtime = formatRuntime(movie.tmdb?.runtime)
  const description = movie.tmdb?.overview
  const trailer = getTrailer(movie)

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
                    <span>{runtime}</span>
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
          {trailer?.key ? (
            <div className={trailerSectionStyle}>
              <PageSection>Trailer</PageSection>
              <div className={trailerEmbedStyle}>
                <iframe
                  className={trailerFrameStyle}
                  src={`https://www.youtube-nocookie.com/embed/${trailer.key}?rel=0`}
                  title={`Trailer for ${movie.title}`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  loading="lazy"
                />
              </div>
            </div>
          ) : null}
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <MovieLocationFilters
            movieSlug={movieSlug}
            screenings={availableScreenings}
            currentCity={currentCity}
            currentCinema={currentCinema}
          />
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

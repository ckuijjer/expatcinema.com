import Image from 'next/image'
import Link from 'next/link'
import React from 'react'

import { css, cx } from 'styled-system/css'

import { headerFont } from '../utils/theme'
import {
  getMoviePosterUrl,
  getMovieReleaseYear,
  Movie,
} from '../utils/getMovies'
import { Layout } from './Layout'

const pageStyle = css({
  marginTop: '16px',
  marginBottom: '16px',
  display: 'grid',
  rowGap: '16px',
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

const introStyle = css({
  marginTop: '0',
  marginBottom: '0',
  fontSize: '16px',
  lineHeight: '1.5',
  color: 'var(--text-muted-color)',
})

const listStyle = css({
  display: 'grid',
  rowGap: '2px',
})

const rowStyle = css({
  display: 'grid',
  gridTemplateColumns: 'auto minmax(0, 1fr)',
  gridColumnGap: '12px',
  lineHeight: '1.5',
  padding: '12px',
  alignItems: 'start',
  minHeight: '72px',
  marginLeft: '-12px',
  marginRight: '-12px',
  textDecoration: 'none',
  color: 'var(--text-color)',
  _hover: {
    backgroundColor: 'var(--background-highlight-color)',
    borderRadius: '10px',
  },
})

const posterStyle = css({
  width: '48px',
  height: '72px',
  borderRadius: '4px',
  objectFit: 'cover',
})

const posterPlaceholderStyle = css({
  width: '48px',
  height: '72px',
  borderRadius: '4px',
  backgroundColor: 'var(--background-highlight-color)',
  border: '1px solid var(--border-color)',
})

const movieTitleStyle = css({
  minWidth: '0',
  paddingTop: '4px',
  fontSize: '18px',
  whiteSpace: 'nowrap',
  textOverflow: 'ellipsis',
  overflow: 'hidden',
})

const titleYearStyle = css({
  color: 'color-mix(in srgb, var(--text-color) 35%, transparent)',
})

const MovieOverviewRow = ({ movie }: { movie: Movie }) => {
  const posterUrl = getMoviePosterUrl(movie.tmdb?.posterPath)
  const year = getMovieReleaseYear(movie)
  const content = (
    <>
      {posterUrl ? (
        <Image
          src={posterUrl}
          width={48}
          height={72}
          alt=""
          aria-hidden
          className={posterStyle}
        />
      ) : (
        <div aria-hidden className={posterPlaceholderStyle} />
      )}
      <div className={movieTitleStyle}>
        {movie.title}
        {year ? <span className={titleYearStyle}> ({year})</span> : null}
      </div>
    </>
  )

  if (movie.slug) {
    return (
      <Link href={`/movie/${movie.slug}`} className={rowStyle}>
        {content}
      </Link>
    )
  }

  return <div className={rowStyle}>{content}</div>
}

export const MoviesOverview = ({ movies }: { movies: Movie[] }) => {
  const sortedMovies = [...movies].sort((left, right) =>
    left.title.localeCompare(right.title, undefined, { sensitivity: 'base' }),
  )

  return (
    <Layout>
      <div className={pageStyle}>
        <div>
          <h1 className={cx(titleStyle, headerFont.className)}>Movies</h1>
          <p className={introStyle}>All movies sorted alphabetically.</p>
        </div>
        <div className={listStyle}>
          {sortedMovies.map((movie) => (
            <MovieOverviewRow key={movie.movieId} movie={movie} />
          ))}
        </div>
      </div>
    </Layout>
  )
}

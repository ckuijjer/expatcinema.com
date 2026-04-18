import Image from 'next/image'
import Link from 'next/link'
import React from 'react'

import { css, cx } from 'styled-system/css'

import {
  getMoviePosterUrl,
  getMovieReleaseYear,
  Movie,
} from '../utils/getMovies'
import { Layout } from './Layout'
import { PageTitle } from './PageTitle'
import { PageSection } from './PageSection'
import {
  listContainerStyle,
  listSectionHeadingStyle,
  listPosterPlaceholderStyle,
  listPosterStyle,
  listRowBaseStyle,
  listTitleStyle,
  listYearStyle,
} from './listStyles'

const pageStyle = css({
  marginTop: '16px',
  marginBottom: '16px',
  display: 'grid',
  rowGap: '16px',
})

const introStyle = css({
  marginTop: '0',
  marginBottom: '0',
  fontSize: '16px',
  lineHeight: '1.5',
  color: 'var(--text-muted-color)',
})

const footerStyle = css({
  fontSize: '18px',
  lineHeight: '1.4',
})

const textLinkStyle = css({
  color: 'var(--secondary-color)',
})

const rowStyle = css({
  display: 'grid',
  gridTemplateColumns: 'auto minmax(0, 1fr)',
  gridColumnGap: '12px',
})

const rowClassName = cx(listRowBaseStyle, rowStyle)

const getMovieSection = (title: string) => {
  const firstLetter = title.trim().charAt(0).toUpperCase()

  return firstLetter >= 'A' && firstLetter <= 'Z' ? firstLetter : '#'
}

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
          className={listPosterStyle}
        />
      ) : (
        <div aria-hidden className={listPosterPlaceholderStyle} />
      )}
      <div className={listTitleStyle}>
        {movie.title}
        {year ? <span className={listYearStyle}> ({year})</span> : null}
      </div>
    </>
  )

  if (movie.slug) {
    return (
      <Link href={`/movie/${movie.slug}`} className={rowClassName}>
        {content}
      </Link>
    )
  }

  return <div className={rowClassName}>{content}</div>
}

export const MoviesOverview = ({ movies }: { movies: Movie[] }) => {
  const sortedMovies = [...movies].sort((left, right) =>
    (left.sortTitle ?? left.title).localeCompare(
      right.sortTitle ?? right.title,
      undefined,
      { sensitivity: 'base' },
    ),
  )

  const moviesBySection = sortedMovies.reduce<Record<string, Movie[]>>(
    (sections, movie) => {
      const section = getMovieSection(movie.sortTitle ?? movie.title)
      sections[section] = sections[section] ?? []
      sections[section].push(movie)
      return sections
    },
    {},
  )

  const sections = Object.keys(moviesBySection).sort((left, right) => {
    if (left === '#') {
      return -1
    }

    if (right === '#') {
      return 1
    }

    return left.localeCompare(right)
  })

  return (
    <Layout>
      <div className={pageStyle}>
        <div>
          <PageTitle>Movies</PageTitle>
          <p className={introStyle}>
            All movies for which there are screenings with English subtitles
            scheduled.
          </p>
        </div>
        <div className={listContainerStyle}>
          {sections.map((section) => (
            <div key={section}>
              <h3 className={listSectionHeadingStyle}>{section}</h3>
              {moviesBySection[section].map((movie) => (
                <MovieOverviewRow key={movie.movieId} movie={movie} />
              ))}
            </div>
          ))}
        </div>
        <div className={footerStyle}>
          <PageSection>Unmatched movies</PageSection>
          <p>
            View the{' '}
            <Link href="/movie/unmatched" className={textLinkStyle}>
              unmatched movies
            </Link>{' '}
            list.
          </p>
        </div>
      </div>
    </Layout>
  )
}

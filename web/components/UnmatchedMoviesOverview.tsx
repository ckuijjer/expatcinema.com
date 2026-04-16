import React from 'react'
import Link from 'next/link'

import { css, cx } from 'styled-system/css'

import { Screening } from '../utils/getScreenings'
import { headerFont, palette } from '../utils/theme'
import { Layout } from './Layout'
import { PageTitle } from './PageTitle'

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

const listStyle = css({
  display: 'grid',
  rowGap: '2px',
})

const sectionStyle = css({
  fontSize: '16px',
  fontWeight: '700',
  margin: '12px 0',
  color: 'var(--text-color)',
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
  '&:hover': {
    backgroundColor: 'var(--background-highlight-color)',
    borderRadius: '10px',
  },
  '&:hover .unmatched-movie-poster-placeholder': {
    backgroundColor: palette.purple500,
    borderColor: palette.purple500,
  },
})

const posterPlaceholderStyle = css({
  width: '48px',
  height: '72px',
  borderRadius: '4px',
  backgroundColor: 'var(--background-highlight-color)',
  border: '1px solid var(--border-color)',
  transition: 'background-color 120ms ease, border-color 120ms ease',
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

const getMovieSection = (title: string) => {
  const firstLetter = title.trim().charAt(0).toUpperCase()

  return firstLetter >= 'A' && firstLetter <= 'Z' ? firstLetter : '#'
}

const getUnmatchedMovieKey = (screening: Screening) =>
  `${screening.title}__${screening.year ?? ''}`

const UnmatchedMovieRow = ({ screening }: { screening: Screening }) => (
  <Link
    href={`/?search=${encodeURIComponent(screening.title)}`}
    className={rowStyle}
  >
    <div
      aria-hidden
      className={cx(
        posterPlaceholderStyle,
        'unmatched-movie-poster-placeholder',
      )}
    />
    <div className={movieTitleStyle}>
      {screening.title}
      {screening.year ? (
        <span className={titleYearStyle}> ({screening.year})</span>
      ) : null}
    </div>
  </Link>
)

export const UnmatchedMoviesOverview = ({
  screenings,
}: {
  screenings: Screening[]
}) => {
  const unmatchedMovies = screenings.filter((screening) => !screening.movieId)

  const uniqueUnmatchedMovies = Array.from(
    unmatchedMovies
      .reduce<Map<string, Screening>>((movies, screening) => {
        const key = getUnmatchedMovieKey(screening)
        if (!movies.has(key)) {
          movies.set(key, screening)
        }

        return movies
      }, new Map())
      .values(),
  ).sort((left, right) => {
    const titleComparison = left.title.localeCompare(right.title, undefined, {
      sensitivity: 'base',
    })

    if (titleComparison !== 0) {
      return titleComparison
    }

    return (right.year ?? 0) - (left.year ?? 0)
  })

  const moviesBySection = uniqueUnmatchedMovies.reduce<
    Record<string, Screening[]>
  >((sections, screening) => {
    const section = getMovieSection(screening.title)
    sections[section] = sections[section] ?? []
    sections[section].push(screening)
    return sections
  }, {})

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
          <PageTitle>Unmatched movies</PageTitle>
          <p className={introStyle}>
            All movies without a movieId, sorted alphabetically.
          </p>
        </div>
        <div className={listStyle}>
          {sections.map((section) => (
            <div key={section}>
              <h3 className={cx(sectionStyle, headerFont.className)}>
                {section}
              </h3>
              {moviesBySection[section].map((screening) => (
                <UnmatchedMovieRow
                  key={getUnmatchedMovieKey(screening)}
                  screening={screening}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </Layout>
  )
}

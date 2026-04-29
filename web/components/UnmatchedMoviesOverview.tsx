'use client'

import React from 'react'

import { css, cx } from 'styled-system/css'

import { useSearch } from '../utils/hooks'
import { Screening } from '../utils/getScreenings'
import type { Movie } from '../utils/getMovies'
import { matchesMovieSearch } from '../utils/searchMatches'
import { MovieOverviewRow } from './MoviesOverview'
import { Layout } from './Layout'
import { PageTitle } from './PageTitle'
import { listContainerStyle, listSectionHeadingStyle } from './listStyles'

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

const rowStyle = cx(
  css({
    '&:hover': {
      backgroundColor: 'var(--background-highlight-color)',
      borderRadius: '10px',
    },
    '& .unmatched-movie-poster-placeholder': {
      backgroundColor: 'var(--background-highlight-color)',
    },
    '&:hover .unmatched-movie-poster-placeholder': {
      backgroundColor: 'var(--palette-purple-300)',
    },
  }),
)

const getMovieSection = (title: string) => {
  const firstLetter = title.trim().charAt(0).toUpperCase()

  return firstLetter >= 'A' && firstLetter <= 'Z' ? firstLetter : '#'
}

const getUnmatchedMovieKey = (screening: Screening) =>
  `${screening.title}__${screening.year ?? ''}`

const toMovie = (screening: Screening): Movie => ({
  movieId: getUnmatchedMovieKey(screening),
  title: screening.title,
  tmdbId: 0,
  tmdb: screening.year
    ? {
        releaseDate: `${screening.year}-01-01`,
      }
    : undefined,
})

export const UnmatchedMoviesOverview = ({
  screenings,
}: {
  screenings: Screening[]
}) => {
  const { search, searchComponents } = useSearch()

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

  const filteredMovies = uniqueUnmatchedMovies.filter((screening) =>
    matchesMovieSearch(toMovie(screening), searchComponents),
  )

  const moviesBySection = filteredMovies.reduce<Record<string, Screening[]>>(
    (sections, screening) => {
      const section = getMovieSection(screening.title)
      sections[section] = sections[section] ?? []
      sections[section].push(screening)
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
          <PageTitle>Unmatched movies</PageTitle>
          <p className={introStyle}>
            All movies that couldn't be matched to a known movie in The Movie
            Database.
          </p>
        </div>
        {filteredMovies.length === 0 ? (
          <h3 className={listSectionHeadingStyle}>
            No movies found{search ? ` for ${search}` : ''}
          </h3>
        ) : (
          <div className={listContainerStyle}>
            {sections.map((section) => (
              <div key={section}>
                <h3 className={listSectionHeadingStyle}>{section}</h3>
                {moviesBySection[section].map((screening) => (
                  <MovieOverviewRow
                    key={getUnmatchedMovieKey(screening)}
                    movie={toMovie(screening)}
                    href={`/?search=${encodeURIComponent(screening.title)}`}
                    className={rowStyle}
                    posterPlaceholderClassName="unmatched-movie-poster-placeholder"
                  />
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}

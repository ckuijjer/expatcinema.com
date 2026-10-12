import Image from 'next/image'
import React from 'react'
import { Suspense } from 'react'
import { Duration } from 'luxon'

import { css, cx } from 'styled-system/css'

import { NavigationBar } from './NavigationBar'
import { TrailerEmbed } from './TrailerEmbed'
import { headerFont } from '../utils/theme'
import {
  getMovieBackdropUrl,
  getMoviePosterUrl,
  getMovieReleaseYear,
} from '../utils/getMovies'
import type { Movie, MovieVideo } from '../utils/getMovies'
import type { Screening } from '../utils/getScreenings'
import { isEnabled, STRUCTURED_DATA_FEATURE } from '../utils/featureFlags'
import { CinemaInfoBar } from './CinemaInfoBar'
import { ExternalLink } from './ExternalLink'
import {
  buildBreadcrumbJsonLd,
  buildMovieJsonLd,
  buildScreeningEventJsonLd,
  serializeJsonLd,
} from '../utils/jsonLd'
import { getCinema } from '../utils/getCinema'
import { getCity } from '../utils/getCity'
import { getMovieDescription } from '../utils/seoMetadata'
import { Calendar } from './Calendar'
import { Layout } from './Layout'
import { MovieLocationFilters } from './MovieLocationFilters'

const pageStyle = css({
  marginTop: '16px',
  marginBottom: '16px',
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
})

// The poster (2:3) and the trailer (16:9) share one height, which shrinks with
// the viewport so that both always fit next to each other
const mediaRowStyle = css({
  display: 'flex',
  gap: '16px',
  height: 'min(300px, calc((100vw - 48px) / 2.4445))',
})

const posterWrapStyle = css({
  position: 'relative',
  flex: '0 0 auto',
  boxSizing: 'border-box',
  height: '100%',
  aspectRatio: '2 / 3',
  borderRadius: '10px',
  overflow: 'hidden',
  backgroundColor: 'var(--background-highlight-color)',
  border: '1px solid var(--border-color)',
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
  color: 'var(--text-subtle-color)',
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

const titleBlockStyle = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  minWidth: '0',
})

// TMDB returns original_language as an ISO 639-1 code, but uses some non-standard
// codes that Intl.DisplayNames (which requires valid BCP 47 tags) doesn't recognise:
// "cn" for Cantonese (BCP 47: "yue"), "sh" for Serbo-Croatian (no ISO 639-1 code),
// "xx" for intentionally absent dialogue. TMDB only returns the code, not a display name.
const TMDB_LANGUAGE_OVERRIDES: Record<string, string> = {
  cn: 'Cantonese',
  sh: 'Serbo-Croatian',
  xx: 'No Language',
}

const languageDisplayNames = new Intl.DisplayNames(['en'], { type: 'language' })

const formatLanguage = (language?: string | null) => {
  if (!language) return undefined
  if (TMDB_LANGUAGE_OVERRIDES[language])
    return TMDB_LANGUAGE_OVERRIDES[language]
  return languageDisplayNames.of(language) ?? language
}

const formatVoteAverage = (voteAverage?: number | null) => {
  if (!voteAverage) return undefined
  return voteAverage.toFixed(1)
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

const MetadataRow = ({
  label,
  value,
}: {
  label: string
  value?: string | null
}) =>
  value ? (
    <div className={metadataItemStyle}>
      <span className={metadataLabelStyle}>{label}:</span>
      <span>{value}</span>
    </div>
  ) : null

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
  const originalLanguage = formatLanguage(movie.tmdb?.originalLanguage)
  const runtime = formatRuntime(movie.tmdb?.runtime)
  const genres = movie.tmdb?.genres?.join(', ') || undefined
  const voteAverage = formatVoteAverage(movie.tmdb?.voteAverage)
  const directors = movie.tmdb?.directors?.join(', ') || undefined
  const originalTitle = movie.tmdb?.originalTitle
  const showOriginalTitle = originalTitle && originalTitle !== movie.title
  const description = movie.tmdb?.overview
  const trailer = getTrailer(movie)
  const cityName = currentCity ? getCity(currentCity)?.name : undefined
  const cinemaData = currentCinema ? getCinema(currentCinema) : undefined
  const cinemaName = cinemaData?.name
  const shouldRenderJsonLd = isEnabled(STRUCTURED_DATA_FEATURE)
  const jsonLd = [
    buildMovieJsonLd(
      movie,
      movieSlug,
      getMovieDescription(movie.title, description ?? undefined),
    ),
    buildBreadcrumbJsonLd(
      movie,
      movieSlug,
      currentCity,
      currentCinema,
      cityName,
      cinemaName,
    ),
    ...screenings.map((screening) =>
      buildScreeningEventJsonLd(movie, movieSlug, screening),
    ),
  ]

  return (
    <>
      {shouldRenderJsonLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
        />
      ) : null}
      <Suspense>
        <Layout backgroundColor="var(--palette-purple-600)">
          <NavigationBar />
        </Layout>
      </Suspense>
      <Layout>
        <div className={pageStyle}>
          <div className={titleBlockStyle}>
            <h1 className={cx(titleStyle, headerFont.className)}>
              {movie.title}
              {year ? <span className={yearStyle}> ({year})</span> : null}
            </h1>
            {showOriginalTitle ? (
              <p
                className={css({
                  margin: '0',
                  fontSize: '20px',
                  color: 'var(--text-muted-color)',
                })}
              >
                {originalTitle}
              </p>
            ) : null}
          </div>
          <div className={mediaRowStyle}>
            <div className={posterWrapStyle}>
              {posterUrl ? (
                <Image
                  src={posterUrl}
                  fill
                  alt={`Poster for ${movie.title}`}
                  className={posterStyle}
                  sizes="200px"
                />
              ) : (
                <div aria-hidden className={posterPlaceholderStyle} />
              )}
            </div>
            {trailer?.key ? (
              <TrailerEmbed
                videoKey={trailer.key}
                title={movie.title}
                backdropUrl={getMovieBackdropUrl(movie.tmdb?.backdropPath)}
              />
            ) : null}
          </div>
          {description ? (
            <p className={descriptionStyle}>{description}</p>
          ) : null}
          <div className={metadataStyle}>
            <MetadataRow label="Director" value={directors} />
            <MetadataRow label="Genre" value={genres} />
            <MetadataRow label="Language" value={originalLanguage} />
            <MetadataRow label="Subtitles" value="English" />
            <MetadataRow label="Runtime" value={runtime} />
            <MetadataRow
              label="Rating"
              value={voteAverage ? `${voteAverage}/10` : undefined}
            />
          </div>
          <div className={linkRowStyle}>
            {tmdbHref ? (
              <ExternalLink href={tmdbHref}>TMDB</ExternalLink>
            ) : null}
            {imdbHref ? (
              <ExternalLink href={imdbHref}>IMDb</ExternalLink>
            ) : null}
          </div>
          <div>
            <MovieLocationFilters
              movieSlug={movieSlug}
              screenings={availableScreenings}
              currentCity={currentCity}
              currentCinema={currentCinema}
            />
          </div>
          {currentCity && currentCinema && cinemaData ? (
            <div>
              <CinemaInfoBar cinema={cinemaData} />
            </div>
          ) : null}
          <div>
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
    </>
  )
}

import { DateTime } from 'luxon'
import Image from 'next/image'

import { css, cx } from 'styled-system/css'

import { Cinema, DoubleFeatureFilm } from '../utils/getScreenings'
import { getMoviePagePath } from '../utils/getMoviePagePath'
import { PosterPlaceholder } from './PosterPlaceholder'
import { Time } from './Time'
import {
  listPosterStyle,
  listRowCenteredStyle,
  listRowTextOnlyStyle,
  listYearStyle,
} from './listStyles'

// The browser skips the layout and paint of rows that are off-screen,
// 72px is the height of the row without its padding, which keeps the scrollbar steady
const flexStyle = css({
  position: 'relative',
  display: 'flex',
  gap: '12px',
})

const containerStyle = cx(
  listRowCenteredStyle,
  flexStyle,
  css({
    contentVisibility: 'auto',
    containIntrinsicSize: 'auto 72px',
  }),
)

// in a list without posters (the movie pages) a row is only as high as its text,
// in a list with posters a row without one keeps the height of the others
const textOnlyContainerStyle = cx(listRowTextOnlyStyle, flexStyle)

// The time and the text, centered in the row as a whole. Both start with an
// 18px line, so the time lines up with the first line of the text
const textGridStyle = css({
  flex: '1 1 0',
  minWidth: '0',
  display: 'grid',
  gridTemplateColumns: '60px minmax(0, 1fr)',
  columnGap: '12px',
  alignItems: 'start',
  pointerEvents: 'none',
})

const textStyle = css({
  minWidth: '0',
  display: 'grid',
})

const mainLineStyle = css({
  minWidth: '0',
  fontSize: '18px',
  overflowWrap: 'anywhere',
})

const secondLineStyle = css({
  minWidth: '0',
  fontSize: '14px',
  color: 'var(--text-muted-color)',
})

// The poster is the way to the movie page on this site, the rest of the row
// goes to the cinema. The padding makes it a bigger target.
const posterLinkStyle = css({
  flex: 'none',
  display: 'block',
  width: '48px',
  height: '72px',
  boxSizing: 'content-box',
  padding: '8px',
  margin: '-8px',
  position: 'relative',
  zIndex: '2',
})

// An "i" centered on the poster. Devices with a hover show it, with a scrim over
// the poster, on hover and on keyboard focus; touch devices have no hover, so
// there it is always there, small and quiet.
const posterOverlayStyle = css({
  position: 'absolute',
  inset: '8px',
  borderRadius: '4px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  pointerEvents: 'none',
  transition: 'background-color 0.15s',
  '@media (hover: hover)': {
    backgroundColor: 'transparent',
    '& > span': { opacity: '0', transition: 'opacity 0.15s' },
    '[data-poster-link]:hover > &, [data-poster-link]:focus-visible > &': {
      backgroundColor: 'rgba(0, 0, 0, 0.55)',
      '& > span': { opacity: '1' },
    },
  },
})

const posterIconStyle = css({
  width: '28px',
  height: '28px',
  borderRadius: '50%',
  border: '2px solid var(--text-inverse-color)',
  color: 'var(--text-inverse-color)',
  backgroundColor: 'rgba(0, 0, 0, 0.4)',
  fontSize: '16px',
  fontWeight: '700',
  lineHeight: '24px',
  textAlign: 'center',
  '@media (hover: none)': {
    width: '22px',
    height: '22px',
    fontSize: '13px',
    lineHeight: '18px',
    opacity: '0.8',
  },
})

// The posters of a double feature next to each other, each on its own way to
// the page of its film. The gap keeps the bigger targets from overlapping.
const postersStyle = css({
  flex: 'none',
  display: 'flex',
  gap: '8px',
})

const screeningRowLinkStyle = css({
  position: 'absolute',
  inset: '0',
  zIndex: '0',
  display: 'block',
  textDecoration: 'none',
  color: 'var(--text-color)',
})

const unmatchedPosterPlaceholderStyle = css({
  backgroundColor: 'transparent',
})

type PosterProps = {
  title: string
  movieId?: string
  movieUrl?: string
  posterUrl?: string
}

// The poster is the way to the movie page on this site; without a movie page it
// is only a picture, or nothing when there is no poster either
const Poster = ({ title, movieId, movieUrl, posterUrl }: PosterProps) => {
  if (posterUrl) {
    const image = (
      <Image
        src={posterUrl}
        width={48}
        height={72}
        alt=""
        aria-hidden
        className={listPosterStyle}
      />
    )

    return movieUrl ? (
      <a
        href={movieUrl}
        className={posterLinkStyle}
        data-poster-link
        aria-label={`More about ${title}`}
      >
        {image}
        <span className={posterOverlayStyle} aria-hidden>
          <span className={posterIconStyle}>i</span>
        </span>
      </a>
    ) : (
      image
    )
  }

  return movieUrl ? (
    <a
      href={movieUrl}
      className={posterLinkStyle}
      data-poster-link
      aria-label={`More about ${title}`}
    >
      <PosterPlaceholder
        title={movieId ? title : undefined}
        className={movieId ? undefined : unmatchedPosterPlaceholderStyle}
      />
      <span className={posterOverlayStyle} aria-hidden>
        <span className={posterIconStyle}>i</span>
      </span>
    </a>
  ) : null
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
  doubleFeature,
  showCity = true,
  showCinema = true,
  showTitle = true,
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
  // the films of a double feature, this screening is one of them
  doubleFeature?: (DoubleFeatureFilm & { movieHref?: string })[]
  showCity?: boolean
  showCinema?: boolean
  showTitle?: boolean
  showPoster?: boolean
}) => {
  const movieUrl =
    movieHref ?? (movieSlug ? getMoviePagePath(movieSlug) : undefined)

  // a double feature is one row with the posters of all its films. The title is
  // theirs, the year is one film's, so it isn't shown
  const isDoubleFeature = (doubleFeature?.length ?? 0) > 1
  const otherFilms = (doubleFeature ?? []).filter(
    (film) => film.movieId !== movieId,
  )
  const films: PosterProps[] = isDoubleFeature
    ? doubleFeature!.map((film) => ({
        title: film.title,
        movieId: film.movieId,
        movieUrl:
          film.movieHref ??
          (film.movieSlug ? getMoviePagePath(film.movieSlug) : undefined),
        posterUrl: film.posterUrl,
      }))
    : [{ title, movieId, movieUrl, posterUrl }]

  const mainLine = showTitle ? (
    isDoubleFeature ? (
      doubleFeature!.map((film) => film.title).join(' + ')
    ) : (
      <>
        {title}
        {year ? <span className={listYearStyle}> ({year})</span> : null}
      </>
    )
  ) : showCinema ? (
    cinema.name
  ) : null
  const cinemaLine = showTitle
    ? showCinema
      ? `${cinema.name}${showCity ? `, ${cinema.city.name}` : ''}`
      : null
    : showCinema && showCity
      ? cinema.city.name
      : null
  // on the page of one film: what it is shown with
  const secondLine =
    isDoubleFeature && !showTitle
      ? [
          cinemaLine,
          `Double feature with ${otherFilms.map((film) => film.title).join(' + ')}`,
        ]
          .filter(Boolean)
          .join(' · ')
      : cinemaLine

  return (
    <div className={showPoster ? containerStyle : textOnlyContainerStyle}>
      <a
        href={url}
        aria-label={`Open screening for ${isDoubleFeature ? doubleFeature!.map((film) => film.title).join(' and ') : title}`}
        className={screeningRowLinkStyle}
      />
      <div className={textGridStyle}>
        <Time>{date}</Time>
        <div className={textStyle}>
          {mainLine ? <div className={mainLineStyle}>{mainLine}</div> : null}
          {secondLine ? (
            <div className={secondLineStyle}>{secondLine}</div>
          ) : null}
        </div>
      </div>
      {showPoster ? (
        isDoubleFeature ? (
          <div className={postersStyle}>
            {films.map((film) => (
              <Poster key={film.movieId} {...film} />
            ))}
          </div>
        ) : (
          <Poster {...films[0]} />
        )
      ) : null}
    </div>
  )
}

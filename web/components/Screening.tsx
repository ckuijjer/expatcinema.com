import { DateTime } from 'luxon'
import Image from 'next/image'

import { css, cx } from 'styled-system/css'

import { Cinema } from '../utils/getScreenings'
import { getMoviePagePath } from '../utils/getMoviePagePath'
import { PosterPlaceholder } from './PosterPlaceholder'
import { Time } from './Time'
import {
  listPosterStyle,
  listRowCenteredStyle,
  listYearStyle,
} from './listStyles'

// The browser skips the layout and paint of rows that are off-screen,
// 72px is the height of the row without its padding, which keeps the scrollbar steady
const containerStyle = cx(
  listRowCenteredStyle,
  css({
    position: 'relative',
    display: 'flex',
    gap: '12px',
    contentVisibility: 'auto',
    containIntrinsicSize: 'auto 72px',
  }),
)

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

const posterLinkStyle = css({
  flex: 'none',
  display: 'block',
  width: '48px',
  height: '72px',
  position: 'relative',
  zIndex: '2',
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
  showCity?: boolean
  showCinema?: boolean
  showTitle?: boolean
  showPoster?: boolean
}) => {
  const movieUrl =
    movieHref ?? (movieSlug ? getMoviePagePath(movieSlug) : undefined)

  const mainLine = showTitle ? (
    <>
      {title}
      {year ? <span className={listYearStyle}> ({year})</span> : null}
    </>
  ) : showCinema ? (
    cinema.name
  ) : null
  const secondLine = showTitle
    ? showCinema
      ? `${cinema.name}${showCity ? ` | ${cinema.city.name}` : ''}`
      : null
    : showCinema && showCity
      ? cinema.city.name
      : null

  return (
    <div className={containerStyle}>
      <a
        href={url}
        aria-label={`Open screening for ${title}`}
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
        posterUrl ? (
          movieUrl ? (
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
          ) : (
            <Image
              src={posterUrl}
              width={48}
              height={72}
              alt=""
              aria-hidden
              className={listPosterStyle}
            />
          )
        ) : movieUrl ? (
          <a href={movieUrl} className={posterLinkStyle}>
            <PosterPlaceholder
              title={movieId ? title : undefined}
              className={movieId ? undefined : unmatchedPosterPlaceholderStyle}
            />
          </a>
        ) : null
      ) : null}
    </div>
  )
}

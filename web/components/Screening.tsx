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

// The event as a small tag and the notes as plain text next to it
const labelsStyle = css({
  minWidth: '0',
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  columnGap: '8px',
  rowGap: '2px',
  marginTop: '2px',
  fontSize: '14px',
  color: 'var(--text-muted-color)',
})

const eventTagStyle = css({
  minWidth: '0',
  overflowWrap: 'anywhere',
  fontSize: '12px',
  lineHeight: '1.4',
  padding: '1px 8px',
  borderRadius: '999px',
  color: 'var(--text-color)',
  backgroundColor: 'color-mix(in srgb, var(--text-color) 10%, transparent)',
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
  event,
  notes,
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
  event?: string
  notes?: string[]
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
      ? `${cinema.name}${showCity ? `, ${cinema.city.name}` : ''}`
      : null
    : showCinema && showCity
      ? cinema.city.name
      : null

  const hasLabels = Boolean(event) || Boolean(notes?.length)

  return (
    <div className={showPoster ? containerStyle : textOnlyContainerStyle}>
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
          {hasLabels ? (
            <div className={labelsStyle}>
              {event ? <span className={eventTagStyle}>{event}</span> : null}
              {notes?.length ? <span>{notes.join(' · ')}</span> : null}
            </div>
          ) : null}
        </div>
      </div>
      {showPoster ? (
        posterUrl ? (
          movieUrl ? (
            <a
              href={movieUrl}
              className={posterLinkStyle}
              data-poster-link
              aria-label={`More about ${title}`}
            >
              <Image
                src={posterUrl}
                width={48}
                height={72}
                alt=""
                aria-hidden
                className={listPosterStyle}
              />
              <span className={posterOverlayStyle} aria-hidden>
                <span className={posterIconStyle}>i</span>
              </span>
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
      ) : null}
    </div>
  )
}

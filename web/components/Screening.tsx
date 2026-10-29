import { DateTime } from 'luxon'
import Image from 'next/image'

import { css, cx } from 'styled-system/css'

import { countOutbound } from '../utils/goatcounter'
import { Cinema } from '../utils/getScreenings'
import { getMoviePagePath } from '../utils/getMoviePagePath'
import { LabelTags } from './LabelTags'
import { MovieLink } from './MovieLink'
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

// the gap to the tags is on the title, so that a tag that wraps has none
const titleStyle = css({ marginRight: '6px' })

const labelsLineStyle = css({ minWidth: '0', marginTop: '2px' })

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

// A small "i" badge in the bottom right corner of the poster, in the style of
// the play button of the trailer: wine with a pink ring. It marks the poster as
// the way to the movie page, always visible so that touch devices have it too.
// The "i" is drawn (a dot and a stem) so that it sits in the middle of the disc.
const posterBadgeStyle = css({
  position: 'absolute',
  right: '12px',
  bottom: '12px',
  width: '18px',
  height: '18px',
  boxSizing: 'border-box',
  borderRadius: '50%',
  border: '1.25px solid var(--palette-purple-300)',
  backgroundColor: 'var(--palette-purple-400)',
  color: 'var(--palette-purple-300)',
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.4)',
  pointerEvents: 'none',
})

const PosterBadge = () => (
  <svg className={posterBadgeStyle} viewBox="0 0 24 24" aria-hidden>
    <circle cx="12" cy="7.4" r="1.7" fill="currentColor" />
    <rect
      x="10.6"
      y="10.6"
      width="2.8"
      height="8.2"
      rx="1.2"
      fill="currentColor"
    />
  </svg>
)

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

  // the page the row is on, with the search for the event

  return (
    <div className={showPoster ? containerStyle : textOnlyContainerStyle}>
      <a
        href={url}
        aria-label={`Open screening for ${title}`}
        onClick={() => countOutbound(cinema.slug, movieSlug)}
        className={screeningRowLinkStyle}
      />
      <div className={textGridStyle}>
        <Time>{date}</Time>
        <div className={textStyle}>
          {mainLine ? (
            <div className={mainLineStyle}>
              <span className={titleStyle}>{mainLine}</span>
              {/* after the title, where the title is the first thing in the row */}
              {showTitle ? (
                <LabelTags event={event} notes={notes} linkToSearch />
              ) : null}
            </div>
          ) : null}
          {secondLine ? (
            <div className={secondLineStyle}>{secondLine}</div>
          ) : null}
          {/* without the title the first line is the cinema, a tag next to it
              would read as part of its name: the tags get a line of their own */}
          {!showTitle && (event || notes?.length) ? (
            <div className={labelsLineStyle}>
              <LabelTags event={event} notes={notes} linkToSearch />
            </div>
          ) : null}
        </div>
      </div>
      {showPoster ? (
        posterUrl ? (
          movieUrl ? (
            <MovieLink
              href={movieUrl}
              className={posterLinkStyle}
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
              <PosterBadge />
            </MovieLink>
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
          <MovieLink
            href={movieUrl}
            className={posterLinkStyle}
            aria-label={`More about ${title}`}
          >
            <PosterPlaceholder
              title={movieId ? title : undefined}
              className={movieId ? undefined : unmatchedPosterPlaceholderStyle}
            />
            <PosterBadge />
          </MovieLink>
        ) : null
      ) : null}
    </div>
  )
}

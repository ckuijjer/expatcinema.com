import { DateTime } from 'luxon'
import Image from 'next/image'

import { css, cx } from 'styled-system/css'

import { Cinema } from '../utils/getScreenings'
import { getMoviePagePath } from '../utils/getMoviePagePath'
import { PosterPlaceholder } from './PosterPlaceholder'
import { Time } from './Time'
import { ExternalLinkIcon } from './ExternalLinkIcon'
import {
  listPosterStyle,
  listRowBaseStyle,
  listRowCompactStyle,
  listTitleStyle,
  listYearStyle,
} from './listStyles'

const gridStyle = css({
  position: 'relative',
  display: 'grid',
  gridTemplateColumns: '[time] 60px [rest] minmax(0, 1fr) [poster] auto',
  gridTemplateRows: 'auto auto',
  gridColumnGap: '12px',
})

// The browser skips the layout and paint of rows that are off-screen,
// 72px is the height of the row without its padding, which keeps the scrollbar steady
const offscreenStyle = css({
  contentVisibility: 'auto',
  containIntrinsicSize: 'auto 72px',
})

const containerStyle = cx(listRowBaseStyle, gridStyle, offscreenStyle)
const compactContainerStyle = cx(listRowCompactStyle, gridStyle)

const timeStyle = css({
  gridColumnStart: 'time',
  gridRow: '1 / span 2',
  alignSelf: 'start',
  paddingTop: '4px',
  pointerEvents: 'none',
})

// A row without a second line: the time and title line up with the middle of the poster
const timeCenteredStyle = css({
  gridColumnStart: 'time',
  gridRow: '1 / span 2',
  alignSelf: 'center',
  pointerEvents: 'none',
})

const titleCenteredStyle = css({
  gridColumnStart: 'rest',
  gridRow: '1 / span 2',
  alignSelf: 'center',
  minWidth: '0',
  fontSize: '18px',
  overflowWrap: 'anywhere',
})

// A row without a title: the cinema is the main line, the city the second
const cinemaNameStyle = css({
  gridColumnStart: 'rest',
  gridRowStart: '1',
  minWidth: '0',
  paddingTop: '4px',
  fontSize: '18px',
  display: 'flex',
  alignItems: 'center',
  pointerEvents: 'none',
})

const cityStyle = css({
  gridColumnStart: 'rest',
  gridRowStart: '2',
  minWidth: '0',
  fontSize: '14px',
  color: 'var(--text-muted-color)',
  pointerEvents: 'none',
})

// A row with neither title nor cinema: only the time and the link to the cinema
const moreInfoStyle = css({
  gridColumnStart: 'rest',
  gridRow: '1 / span 2',
  alignSelf: 'center',
  fontSize: '16px',
  color: 'var(--secondary-color)',
  pointerEvents: 'none',
})

const contentStyle = css({
  display: 'contents',
})

const cinemaInfoStyle = css({
  gridColumnStart: 'rest',
  gridRowStart: '2',
  minWidth: '0',
  fontSize: '14px',
  color: 'var(--text-muted-color)',
  display: 'flex',
  alignItems: 'center',
  pointerEvents: 'none',
})

const cinemaIconFrameStyle = css({
  width: '18px',
  height: '18px',
  marginRight: '6px',
  borderRadius: '4px',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: '0',
  overflow: 'hidden',
  backgroundColor: 'var(--text-inverse-color)',
  border: '1px solid var(--border-color)',
})

const cinemaIconStyle = css({
  display: 'block',
})

const posterLinkStyle = css({
  gridRow: '1 / span 2',
  alignSelf: 'start',
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

type CinemaIconProps = {
  cinema: Cinema
}

const CinemaIcon = ({ cinema }: CinemaIconProps) => {
  if (!cinema.logo) {
    return null
  }

  return (
    <span className={cinemaIconFrameStyle}>
      <Image
        src={`/images/${cinema.logo}`}
        width={14}
        height={14}
        alt={`Logo for ${cinema.name}`}
        className={cinemaIconStyle}
      />
    </span>
  )
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

  const hasSecondLine = showTitle ? showCinema : showCinema && showCity
  const hasPoster = showPoster && (posterUrl || movieUrl)
  // a lone line is centered next to a poster, and a row without a poster is lower
  const centered = !hasSecondLine && Boolean(hasPoster)

  return (
    <div
      className={
        hasSecondLine || hasPoster ? containerStyle : compactContainerStyle
      }
    >
      <a
        href={url}
        aria-label={`Open screening for ${title}`}
        className={screeningRowLinkStyle}
      />
      <div className={centered ? timeCenteredStyle : timeStyle}>
        <Time>{date}</Time>
      </div>
      <div className={contentStyle}>
        {showTitle ? (
          <div
            className={centered ? titleCenteredStyle : listTitleStyle}
            style={{ pointerEvents: 'none' }}
          >
            {title}
            {year ? <span className={listYearStyle}> ({year})</span> : null}
          </div>
        ) : null}
        {showTitle && showCinema ? (
          <div className={cinemaInfoStyle}>
            <CinemaIcon cinema={cinema} />
            {cinema.name}
            {showCity ? <> | {cinema.city.name}</> : null}
          </div>
        ) : null}
        {!showTitle && showCinema ? (
          <>
            <div className={cinemaNameStyle}>
              <CinemaIcon cinema={cinema} />
              {cinema.name}
            </div>
            {showCity ? (
              <div className={cityStyle}>{cinema.city.name}</div>
            ) : null}
          </>
        ) : null}
        {!showTitle && !showCinema ? (
          <div className={moreInfoStyle}>
            More info
            <ExternalLinkIcon />
          </div>
        ) : null}
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

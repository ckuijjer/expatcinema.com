import { DateTime } from 'luxon'
import Image from 'next/image'

import { css } from 'styled-system/css'

import { getMoviePagePath } from '../utils/getMoviePagePath'
import { countOutbound } from '../utils/goatcounter'
import { ScreeningWithLuxonDate } from '../utils/groupAndSortScreenings'
import { LabelTags } from './LabelTags'
import { MovieLink } from './MovieLink'
import { ScreeningTimeChips } from './ScreeningTimeChips'
import { PosterPlaceholder } from './PosterPlaceholder'
import { listPosterStyle, listYearStyle } from './listStyles'

export type GroupedScreening = ScreeningWithLuxonDate & { movieHref?: string }

// The screenings of one film on one day: the film once, and a line for each
// screening. The film (poster, title) goes to the movie page, a line goes to
// the cinema. The browser skips the layout and paint of what is off-screen.
const filmStyle = css({
  marginTop: '20px',
  contentVisibility: 'auto',
  containIntrinsicSize: 'auto 120px',
})

// 12px of padding, as the rows of the other lists, so that the poster lines up
// with the date above it
const filmLinkStyle = css({
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  minHeight: '72px',
  padding: '8px 12px',
  margin: '0 -12px',
  textDecoration: 'none',
  color: 'var(--text-color)',
  lineHeight: '1.5',
  _hover: {
    backgroundColor: 'var(--background-highlight-color)',
    borderRadius: '10px',
  },
})

const filmTextStyle = css({ minWidth: '0', display: 'grid' })

const titleStyle = css({
  fontSize: '20px',
  lineHeight: '1.3',
  overflowWrap: 'anywhere',
})

// the boxes start at the left edge of the poster, right under it
const linesStyle = css({
  display: 'grid',
  rowGap: '6px',
  marginTop: '2px',
})

// on the page of a film there is no film above the lines: they start at the edge
const linesOnlyStyle = css({
  display: 'grid',
  rowGap: '6px',
  marginTop: '16px',
})

const lineStyle = css({
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  // a label that does not fit next to the place goes under it
  flexWrap: 'wrap',
  gap: '4px 8px',
  minHeight: '38px',
  padding: '6px 10px',
  lineHeight: '1.4',
  borderRadius: '10px',
  border: '1px solid var(--border-color)',
  _hover: { backgroundColor: 'var(--background-highlight-color)' },
})

const lineLinkStyle = css({
  position: 'absolute',
  inset: '0',
  zIndex: '0',
  display: 'block',
  textDecoration: 'none',
  color: 'var(--text-color)',
})

// the text does not take clicks, the link behind it does
const lineTextStyle = css({
  flex: '1 1 auto',
  minWidth: '0',
  display: 'flex',
  alignItems: 'baseline',
  gap: '8px',
  pointerEvents: 'none',
})

const timeStyle = css({
  // the same width for every time, so that the places line up
  flex: '0 0 46px',
  fontSize: '15px',
  fontWeight: '700',
  fontVariantNumeric: 'tabular-nums',
})

const placeStyle = css({
  minWidth: '0',
  fontSize: '14px',
  overflowWrap: 'anywhere',
})

// pushed to the right, above the link behind the line (the tags are links too)
const labelsStyle = css({ flex: 'none', marginLeft: 'auto', lineHeight: '1' })

const formatTime = (date: DateTime) =>
  date
    .setZone('Europe/Amsterdam')
    .toLocaleString(DateTime.TIME_24_SIMPLE, { locale: 'en-GB' })

const ScreeningLine = ({
  screening,
  showCity,
  title,
}: {
  screening: GroupedScreening
  showCity: boolean
  title: string
}) => {
  const place = `${screening.cinema.name}${showCity ? `, ${screening.cinema.city.name}` : ''}`

  return (
    <div className={lineStyle}>
      <a
        href={screening.url}
        aria-label={`Open screening for ${title} at ${formatTime(screening.date)}`}
        onClick={() =>
          countOutbound(screening.cinema.slug, screening.movieSlug)
        }
        className={lineLinkStyle}
      />
      <div className={lineTextStyle}>
        <span className={timeStyle}>{formatTime(screening.date)}</span>
        <span className={placeStyle}>{place}</span>
      </div>
      {screening.event || screening.notes?.length ? (
        <span className={labelsStyle}>
          <LabelTags
            event={screening.event}
            notes={screening.notes}
            linkToSearch
          />
        </span>
      ) : null}
    </div>
  )
}

const Poster = ({ film }: { film: GroupedScreening }) =>
  film.posterUrl ? (
    <Image
      src={film.posterUrl}
      width={48}
      height={72}
      alt=""
      aria-hidden
      className={listPosterStyle}
    />
  ) : (
    <PosterPlaceholder
      title={film.movieId ? film.title : undefined}
      className={film.movieId ? undefined : unmatchedPosterStyle}
    />
  )

const unmatchedPosterStyle = css({ backgroundColor: 'transparent' })

export const FilmWithScreenings = ({
  screenings,
  showCity,
  showCinema,
}: {
  screenings: GroupedScreening[]
  showCity: boolean
  showCinema: boolean
}) => {
  const film = screenings[0]
  const movieUrl =
    film.movieHref ??
    (film.movieSlug ? getMoviePagePath(film.movieSlug) : undefined)

  const header = (
    <>
      <Poster film={film} />
      <div className={filmTextStyle}>
        <div className={titleStyle}>
          {film.title}
          {film.year ? (
            <span className={listYearStyle}> ({film.year})</span>
          ) : null}
        </div>
      </div>
    </>
  )

  return (
    <section className={filmStyle}>
      {movieUrl ? (
        <MovieLink
          href={movieUrl}
          className={filmLinkStyle}
          aria-label={`More about ${film.title}`}
        >
          {header}
        </MovieLink>
      ) : (
        <div className={filmLinkStyle}>{header}</div>
      )}
      {showCinema ? (
        <div className={linesStyle}>
          {screenings.map((screening) => (
            <ScreeningLine
              key={`${screening.url}-${screening.date.toISO()}`}
              screening={screening}
              showCity={showCity}
              title={film.title}
            />
          ))}
        </div>
      ) : (
        // on a cinema page the lines would be just a time: the same time chips as
        // the page of a film at one cinema, under the title
        <div>
          <ScreeningTimeChips
            screenings={screenings}
            runtimeMinutes={film.runtimeMinutes}
            compact
          />
        </div>
      )}
    </section>
  )
}

// The lines of the screenings of a film, without the film: on the page of the film
export const ScreeningLines = ({
  screenings,
  showCity,
  showCinema,
}: {
  screenings: GroupedScreening[]
  showCity: boolean
  showCinema: boolean
}) => (
  <div className={linesOnlyStyle}>
    {screenings.map((screening) => (
      <ScreeningLine
        key={`${screening.url}-${screening.date.toISO()}`}
        screening={screening}
        showCity={showCity}
        title={screening.title}
      />
    ))}
  </div>
)

// the films of a day, in the order of their first screening
export const groupByFilm = (screenings: GroupedScreening[]) => {
  const films = new Map<string, GroupedScreening[]>()

  for (const screening of screenings) {
    const key = screening.movieId ?? `${screening.title}|${screening.year}`
    films.set(key, [...(films.get(key) ?? []), screening])
  }

  return [...films.values()]
}

import { DateTime } from 'luxon'

import { css } from 'styled-system/css'

const chipsStyle = css({
  display: 'flex',
  flexWrap: 'wrap',
  gap: '8px',
  // the same air as the rows of the other movie pages: 16px above and below,
  // on top of the 4px under the date heading and the 2px between rows
  marginTop: '16px',
  marginBottom: '18px',
})

const chipStyle = css({
  padding: '8px 14px',
  fontSize: '18px',
  lineHeight: '1.2',
  fontVariantNumeric: 'tabular-nums',
  color: 'var(--text-color)',
  textDecoration: 'none',
  // a long label is cut off, the full text is in the title
  display: 'inline-block',
  maxWidth: '100%',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  borderRadius: '8px',
  border: '1px solid color-mix(in srgb, var(--text-color) 35%, transparent)',
  _hover: {
    borderColor: 'var(--text-color)',
    backgroundColor: 'var(--background-highlight-color)',
  },
  '&:focus-visible': {
    outline: '2px solid var(--secondary-color)',
    outlineOffset: '2px',
  },
  '@media (prefers-color-scheme: dark)': {
    '&:focus-visible': { outlineColor: 'var(--primary-color)' },
  },
})

const labelStyle = css({
  marginLeft: '6px',
  fontSize: '14px',
  color: 'var(--text-muted-color)',
})

const formatTime = (date: DateTime) =>
  date
    .setZone('Europe/Amsterdam')
    .toLocaleString(DateTime.TIME_24_SIMPLE, { locale: 'en-GB' })

// The times of one day as buttons, for a page where the film and the cinema are
// already known. A screening with an event or notes has them after the time. The
// title shows them in full, and when the film ends if its runtime is known.
export const ScreeningTimeChips = ({
  screenings,
  runtimeMinutes,
}: {
  screenings: {
    url: string
    date: DateTime
    event?: string
    notes?: string[]
  }[]
  runtimeMinutes?: number | null
}) => (
  <div className={chipsStyle}>
    {screenings.map(({ url, date, event, notes }) => {
      const label = [event, ...(notes ?? [])].filter(Boolean).join(' · ')
      const ends = runtimeMinutes
        ? `${formatTime(date)} – ${formatTime(date.plus({ minutes: runtimeMinutes }))}`
        : undefined

      return (
        <a
          key={`${url}-${date.toISO()}`}
          href={url}
          className={chipStyle}
          title={[label, ends].filter(Boolean).join('\n') || undefined}
        >
          {formatTime(date)}
          {label ? <span className={labelStyle}>· {label}</span> : null}
        </a>
      )
    })}
  </div>
)

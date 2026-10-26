import Link from 'next/link'

import { css, cx } from 'styled-system/css'

// The space to the right of a tag, not to the left of it: a tag that wraps
// starts at the left edge of the text, and the title has the same gap after it
const tagStyle = css({
  display: 'inline-block',
  maxWidth: '100%',
  marginRight: '6px',
  padding: '1px 6px',
  verticalAlign: 'middle',
  overflowWrap: 'anywhere',
  fontSize: '12px',
  lineHeight: '1.4',
  // the color of the line with the cinema, for the text and the border
  color: 'var(--text-muted-color)',
  border: '1px solid currentColor',
  borderRadius: '4px',
})

// The tag of an event that links to the search for it. It sits in a row that
// has a link over it, and in text that doesn't take clicks: above them both.
const linkStyle = css({
  position: 'relative',
  zIndex: '2',
  pointerEvents: 'auto',
  textDecoration: 'none',
  _hover: {
    color: 'var(--text-color)',
    backgroundColor: 'var(--background-color)',
  },
  '&:focus-visible': {
    outline: '2px solid var(--secondary-color)',
    outlineOffset: '2px',
  },
  '@media (prefers-color-scheme: dark)': {
    '&:focus-visible': { outlineColor: 'var(--primary-color)' },
  },
})

// The event of a screening and its notes, each as a tag, in the flow of the
// line of text they come after
export const LabelTags = ({
  event,
  notes,
  eventHref,
}: {
  event?: string
  notes?: string[]
  // where the tag of the event goes, a notes' tag never links
  eventHref?: string
}) => (
  <>
    {event && eventHref ? (
      <Link
        href={eventHref}
        className={cx(tagStyle, linkStyle)}
        aria-label={`Show all ${event} screenings`}
      >
        {event}
      </Link>
    ) : event ? (
      <span className={tagStyle}>{event}</span>
    ) : null}
    {notes?.map((note) => (
      <span key={note} className={tagStyle}>
        {note}
      </span>
    ))}
  </>
)

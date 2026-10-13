import { css, cx } from 'styled-system/css'

import { headerFont } from '../utils/theme'
import { ExternalLinkIcon } from './ExternalLinkIcon'
import { bigTitleStyle } from './titleStyles'

const linkStyle = css({
  display: 'inline-block',
  marginLeft: '12px',
  color: 'var(--secondary-color)',
  verticalAlign: 'baseline',
  '&:hover': {
    opacity: '0.75',
  },
})

// The name of the cinema with a link to its website. The address and the Google Maps
// link stay in the cinema data, for the structured data of the cinema.
// On a page that has a title of its own (a movie) this is an h2
export const CinemaTitle = ({
  cinema,
  as: Tag = 'h1',
}: {
  cinema: { name: string; url: string }
  as?: 'h1' | 'h2'
}) => (
  <Tag className={cx(bigTitleStyle, headerFont.className)}>
    {cinema.name}
    <a
      href={cinema.url}
      target="_blank"
      rel="noreferrer"
      className={linkStyle}
      aria-label={`Website of ${cinema.name}`}
    >
      <ExternalLinkIcon size={22} />
    </a>
  </Tag>
)

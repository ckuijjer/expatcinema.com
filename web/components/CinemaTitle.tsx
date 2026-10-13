import { css, cx } from 'styled-system/css'

import { headerFont } from '../utils/theme'
import { ExternalLink } from './ExternalLink'
import { bigTitleStyle } from './titleStyles'

const blockStyle = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  minWidth: '0',
})

const linkRowStyle = css({
  display: 'flex',
  gap: '8px 14px',
  flexWrap: 'wrap',
  // as the links in the old info card
  fontSize: '15px',
  lineHeight: '1.35',
})

// The name of the cinema with the links to its website and to its location on Google Maps.
// The address itself is not shown, but stays in the cinema data for the structured data.
// On a page that has a title of its own (a movie) this is an h2
export const CinemaTitle = ({
  cinema,
  as: Tag = 'h1',
}: {
  cinema: { name: string; url: string; address: { googleMapsUrl: string } }
  as?: 'h1' | 'h2'
}) => (
  <div className={blockStyle}>
    <Tag className={cx(bigTitleStyle, headerFont.className)}>{cinema.name}</Tag>
    <div className={linkRowStyle}>
      <ExternalLink href={cinema.url}>Website</ExternalLink>
      <ExternalLink href={cinema.address.googleMapsUrl}>
        Google Maps
      </ExternalLink>
    </div>
  </div>
)

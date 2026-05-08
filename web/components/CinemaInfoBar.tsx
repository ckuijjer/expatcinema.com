import { css } from 'styled-system/css'

import { ExternalLink } from './ExternalLink'

type CinemaInfo = {
  name: string
  url: string
  address: {
    streetAddress: string
    postalCode: string
    addressLocality: string
    googleMapsUrl: string
  }
}

const barStyle = css({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: '8px 14px',
  marginTop: '16px',
  padding: '10px 12px',
  borderRadius: '10px',
  backgroundColor: 'var(--background-highlight-color)',
  color: 'var(--text-color)',
  fontSize: '15px',
  lineHeight: '1.35',
})

const nameStyle = css({
  fontWeight: '700',
})

const addressStyle = css({
  color: 'var(--text-muted-color)',
})

export const CinemaInfoBar = ({ cinema }: { cinema: CinemaInfo }) => {
  const { address } = cinema
  const addressLabel = `${address.streetAddress}, ${address.postalCode} ${address.addressLocality}`

  return (
    <aside className={barStyle} aria-label={`${cinema.name} information`}>
      <span className={nameStyle}>{cinema.name}</span>
      <span className={addressStyle}>{addressLabel}</span>
      <ExternalLink href={cinema.url}>Website</ExternalLink>
      <ExternalLink href={address.googleMapsUrl}>Google Maps</ExternalLink>
    </aside>
  )
}

import React from 'react'

import { css } from 'styled-system/css'

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

const linkStyle = css({
  color: 'var(--secondary-color)',
  textDecoration: 'underline',
  textUnderlineOffset: '2px',
  whiteSpace: 'nowrap',
  '&:hover': {
    opacity: '0.75',
  },
})

const ExternalLinkIcon = () => (
  <svg
    width="11"
    height="11"
    viewBox="0 0 11 11"
    fill="currentColor"
    style={{ display: 'inline', verticalAlign: 'middle', marginLeft: '2px' }}
    aria-hidden="true"
  >
    <path d="M0 1.5A1.5 1.5 0 011.5 0H5v1.5H1.5v8h8V6H11v3.5A1.5 1.5 0 019.5 11h-8A1.5 1.5 0 010 9.5v-8z" />
    <path d="M6.5 0H11v4.5H9.5V2.56L5.03 7.03 3.97 5.97 8.44 1.5H6.5V0z" />
  </svg>
)

export const CinemaInfoBar = ({ cinema }: { cinema: CinemaInfo }) => {
  const { address } = cinema
  const addressLabel = `${address.streetAddress}, ${address.postalCode} ${address.addressLocality}`

  return (
    <aside className={barStyle} aria-label={`${cinema.name} information`}>
      <span className={nameStyle}>{cinema.name}</span>
      <span className={addressStyle}>{addressLabel}</span>
      <a
        className={linkStyle}
        href={cinema.url}
        target="_blank"
        rel="noreferrer"
      >
        Website<ExternalLinkIcon />
      </a>
      <a
        className={linkStyle}
        href={address.googleMapsUrl}
        target="_blank"
        rel="noreferrer"
      >
        Google Maps<ExternalLinkIcon />
      </a>
    </aside>
  )
}

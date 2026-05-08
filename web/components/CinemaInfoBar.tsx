import React from 'react'

import { css } from 'styled-system/css'

import { ExternalLinkIcon } from './ExternalLinkIcon'

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

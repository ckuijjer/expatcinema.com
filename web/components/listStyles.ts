import { css } from 'styled-system/css'

import { headerFont } from '../utils/theme'

export const listContainerStyle = css({
  display: 'grid',
  rowGap: '2px',
})

export const listSectionTitleStyle = css({
  fontSize: '16px',
  fontWeight: '700',
  // the rows below have 12px padding of their own, so 4px is enough underneath
  // and the 28px on top (plus the 12px of the row above) separates the days
  margin: '28px 0 4px',
  lineHeight: '1.4',
  color: 'var(--text-color)',
})

export const listSectionHeadingStyle = `${listSectionTitleStyle} ${headerFont.className}`

const listRowProps = {
  lineHeight: '1.5',
  padding: '12px',
  alignItems: 'start',
  marginLeft: '-12px',
  marginRight: '-12px',
  textDecoration: 'none',
  color: 'var(--text-color)',
  _hover: {
    backgroundColor: 'var(--background-highlight-color)',
    borderRadius: '10px',
  },
} as const

export const listRowBaseStyle = css({ ...listRowProps, minHeight: '72px' })

// Screening rows, with the content centered. A row with a poster is at least as high
// as the poster (72px plus padding), a row without one is as high as its text, which
// is still more than the 44px that is needed to tap it
export const listRowCenteredStyle = css({
  ...listRowProps,
  alignItems: 'center',
  minHeight: '72px',
})

export const listRowTextOnlyStyle = css({
  ...listRowProps,
  alignItems: 'center',
})

export const listPosterStyle = css({
  width: '48px',
  height: '72px',
  borderRadius: '4px',
  objectFit: 'cover',
})

export const listPosterPlaceholderStyle = css({
  width: '48px',
  height: '72px',
  borderRadius: '4px',
  backgroundColor: 'var(--background-highlight-color)',
  border: '1px solid var(--border-color)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '16px',
  fontWeight: '700',
  color: 'var(--text-subtle-color)',
  userSelect: 'none',
})

export const listTitleStyle = css({
  minWidth: '0',
  paddingTop: '4px',
  fontSize: '18px',
  overflowWrap: 'anywhere',
})

export const listYearStyle = css({
  color: 'var(--text-subtle-color)',
})

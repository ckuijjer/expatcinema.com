import { css } from 'styled-system/css'

import { headerFont } from '../utils/theme'

export const listContainerStyle = css({
  display: 'grid',
  rowGap: '2px',
})

export const listSectionTitleStyle = css({
  fontSize: '16px',
  fontWeight: '700',
  margin: '12px 0',
  color: 'var(--text-color)',
})

export const listSectionHeadingStyle = `${listSectionTitleStyle} ${headerFont.className}`

export const listRowBaseStyle = css({
  lineHeight: '1.5',
  padding: '12px',
  alignItems: 'start',
  minHeight: '72px',
  marginLeft: '-12px',
  marginRight: '-12px',
  textDecoration: 'none',
  color: 'var(--text-color)',
  _hover: {
    backgroundColor: 'var(--background-highlight-color)',
    borderRadius: '10px',
  },
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
})

export const listTitleStyle = css({
  minWidth: '0',
  paddingTop: '4px',
  fontSize: '18px',
  whiteSpace: 'nowrap',
  textOverflow: 'ellipsis',
  overflow: 'hidden',
})

export const listYearStyle = css({
  color: 'color-mix(in srgb, var(--text-color) 35%, transparent)',
})

import { css } from 'styled-system/css'

// An icon with its name below it, as a button without the browser's button look
export const iconButtonStyle = css({
  padding: '0',
  border: 'none',
  background: 'none',
  color: 'inherit',
  fontFamily: 'inherit',
  minWidth: '40px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '4px',
  boxSizing: 'border-box',
  cursor: 'pointer',
})

export const iconLabelStyle = css({
  fontSize: '12px',
  lineHeight: '1',
})

// Icons differ in height, a fixed box keeps the labels on one line
export const iconBoxStyle = css({
  height: '32px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
})

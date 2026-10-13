import { css } from 'styled-system/css'

// An icon with its name below it, as a button without the browser's button look.
// The icon and the name are stacked and centered in the header.
export const iconButtonStyle = css({
  padding: '4px 2px',
  border: 'none',
  background: 'none',
  color: 'inherit',
  fontFamily: 'inherit',
  minWidth: '40px',
  minHeight: '44px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '3px',
  boxSizing: 'border-box',
  cursor: 'pointer',
})

// Gives the icons (which differ in size) the same box, so the names line up
export const iconBoxStyle = css({
  width: '28px',
  height: '28px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  '& svg': {
    display: 'block',
    maxWidth: '28px',
    maxHeight: '28px',
  },
})

export const iconLabelStyle = css({
  fontSize: '12px',
  lineHeight: '1',
  whiteSpace: 'nowrap',
})

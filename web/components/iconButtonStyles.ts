import { css } from 'styled-system/css'

// An icon with its name below it, as a button without the browser's button look.
// On a phone the icon and the name are stacked and centered in the header, on a
// wider screen the name goes next to the icon, like the Movies and About links.
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
  '@media (min-width: 600px)': {
    flexDirection: 'row',
    gap: '8px',
    padding: '4px 0',
  },
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
  '@media (min-width: 600px)': {
    width: '24px',
    height: '24px',
    '& svg': { maxWidth: '24px', maxHeight: '24px' },
  },
})

// the serif font of the Movies and About links on a wide screen is set by .icon-label in globals.css
export const iconLabelStyle = `icon-label ${css({
  fontSize: '12px',
  lineHeight: '1',
  whiteSpace: 'nowrap',
  '@media (min-width: 600px)': {
    fontSize: '18px',
    fontWeight: '700',
  },
})}`

import { css } from 'styled-system/css'

// An icon with its name below it, as a button without the browser's button look.
// The name hangs below the icon, so the icons sit where they would without it.
export const iconButtonStyle = css({
  position: 'relative',
  padding: '0',
  border: 'none',
  background: 'none',
  color: 'inherit',
  fontFamily: 'inherit',
  width: '32px',
  height: '32px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxSizing: 'border-box',
  cursor: 'pointer',
})

export const iconLabelStyle = css({
  position: 'absolute',
  top: '100%',
  left: '50%',
  transform: 'translateX(-50%)',
  marginTop: '2px',
  fontSize: '12px',
  lineHeight: '1',
  whiteSpace: 'nowrap',
})

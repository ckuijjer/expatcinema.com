'use client'

import { useEffect, useState } from 'react'

import { css } from 'styled-system/css'

const buttonStyle = css({
  position: 'fixed',
  bottom: '20px',
  right: '20px',
  width: '36px',
  height: '36px',
  borderRadius: '50%',
  border: 'none',
  backgroundColor: 'var(--secondary-color)',
  color: 'var(--text-inverse-color)',
  fontSize: '16px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  opacity: '0.85',
  zIndex: '101',
  boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
  transition: 'opacity 0.2s',
  '&:hover': {
    opacity: '1',
  },
})

export const ScrollToTop = () => {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 300)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  if (!visible) return null

  return (
    <button
      className={buttonStyle}
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Back to top"
    >
      ↑
    </button>
  )
}

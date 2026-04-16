'use client'

import Link from 'next/link'
import React, { useState } from 'react'

import { css, cx } from 'styled-system/css'

import { useKeypress } from '../utils/hooks'
import { headerFont } from '../utils/theme'
import { Layout } from './Layout'
import CrossIcon from './icons/CrossIcon'
import MenuIcon from './icons/MenuIcon'

const menuItemStyle = css({
  fontSize: '24px',
  fontWeight: '700',
  color: 'var(--text-inverse-color)',
  padding: '12px 24px',
  textDecoration: 'none',
  textAlign: 'center',
})

const menuTextItemStyle = css({
  fontSize: '18px',
  fontWeight: '700',
  color: 'var(--text-inverse-color)',
  textDecoration: 'none',
  '@media (max-width: 600px)': {
    display: 'none',
  },
})

const menuButtonStyle = css({
  width: '32px',
  height: '32px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxSizing: 'border-box',
  cursor: 'pointer',
  '@media (min-width: 600px)': {
    display: 'none',
  },
})

const menuModalStyle = css({
  top: '0',
  left: '0',
  bottom: '0',
  right: '0',
  position: 'fixed',
  backgroundColor: 'var(--background-inverse-color)',
  zIndex: '1',
})

const menuModalContentStyle = css({
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  paddingTop: '64px',
})

const menuCloseButtonStyle = css({
  position: 'absolute',
  top: '28px',
  right: '0',
  width: '32px',
  height: '32px',
  boxSizing: 'border-box',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
})

export const Menu = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const openMenu = () => {
    setIsMenuOpen(true)
  }

  const closeMenu = () => {
    setIsMenuOpen(false)
  }

  return (
    <>
      <Link
        href="/about"
        className={cx(menuTextItemStyle, headerFont.className)}
      >
        About
      </Link>
      <Link
        href="/movie"
        className={cx(menuTextItemStyle, headerFont.className)}
      >
        Movies
      </Link>
      <Link
        href="/statistics"
        className={cx(menuTextItemStyle, headerFont.className)}
      >
        Statistics
      </Link>
      <div className={menuButtonStyle} onClick={openMenu}>
        <MenuIcon />
      </div>
      {isMenuOpen && (
        <div className={menuModalStyle} onClick={closeMenu}>
          <Layout>
            <div className={menuModalContentStyle}>
              <div className={menuCloseButtonStyle} onClick={closeMenu}>
                <CrossIcon color="var(--text-inverse-color)" />
              </div>
              <Link
                href="/"
                className={cx(menuItemStyle, headerFont.className)}
              >
                Home
              </Link>
              <Link
                href="/about"
                className={cx(menuItemStyle, headerFont.className)}
              >
                About
              </Link>
              <Link
                href="/movie"
                className={cx(menuItemStyle, headerFont.className)}
              >
                Movies
              </Link>
              <Link
                href="/statistics"
                className={cx(menuItemStyle, headerFont.className)}
              >
                Statistics
              </Link>
            </div>
          </Layout>
        </div>
      )}
    </>
  )
}

'use client'

import Link from 'next/link'
import React, { useState } from 'react'

import { css, cx } from 'styled-system/css'

import { useKeypress } from '../utils/hooks'
import { headerFont } from '../utils/theme'
import { Layout } from './Layout'
import {
  iconBoxStyle,
  iconButtonStyle,
  iconLabelStyle,
} from './iconButtonStyles'
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
})

const mainNavStyle = css({
  display: 'flex',
  gap: '24px',
  alignItems: 'center',
  '@media (max-width: 600px)': {
    display: 'none',
  },
})

const menuButtonStyle = cx(
  iconButtonStyle,
  css({
    '@media (min-width: 600px)': {
      display: 'none',
    },
  }),
)

const menuModalStyle = css({
  top: '0',
  left: '0',
  bottom: '0',
  right: '0',
  position: 'fixed',
  backgroundColor: 'var(--background-inverse-color)',
  zIndex: '10',
})

const menuModalContentStyle = css({
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  paddingTop: '64px',
})

const menuCloseButtonStyle = cx(
  iconButtonStyle,
  css({
    position: 'absolute',
    top: '18px',
    right: '0',
  }),
)

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
      <nav aria-label="Main" className={mainNavStyle}>
        <Link
          href="/movie"
          className={cx(menuTextItemStyle, headerFont.className)}
        >
          Movies
        </Link>
        <Link
          href="/about"
          className={cx(menuTextItemStyle, headerFont.className)}
        >
          About
        </Link>
      </nav>
      <button
        type="button"
        className={menuButtonStyle}
        onClick={openMenu}
        aria-label="Menu"
        aria-expanded={isMenuOpen}
      >
        <span className={iconBoxStyle}>
          <MenuIcon />
        </span>
        <span className={iconLabelStyle}>Menu</span>
      </button>
      {isMenuOpen && (
        <div className={menuModalStyle} onClick={closeMenu}>
          <Layout>
            <nav aria-label="Menu" className={menuModalContentStyle}>
              <button
                type="button"
                className={menuCloseButtonStyle}
                onClick={closeMenu}
                aria-label="Close menu"
              >
                <span className={iconBoxStyle}>
                  <CrossIcon color="var(--text-inverse-color)" />
                </span>
                <span className={iconLabelStyle}>Close</span>
              </button>
              <Link
                href="/"
                className={cx(menuItemStyle, headerFont.className)}
              >
                Home
              </Link>
              <Link
                href="/movie"
                className={cx(menuItemStyle, headerFont.className)}
              >
                Movies
              </Link>
              <Link
                href="/about"
                className={cx(menuItemStyle, headerFont.className)}
              >
                About
              </Link>
            </nav>
          </Layout>
        </div>
      )}
    </>
  )
}

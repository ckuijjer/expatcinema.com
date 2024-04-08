import { css } from '@emotion/react'
import Link from 'next/link'
import React, { useState } from 'react'

import { useKeypress } from '../utils/hooks'
import { headerFont } from '../utils/theme'
import { Layout } from './Layout'
import CrossIcon from './icons/cross.svg'
import MenuIcon from './icons/menu.svg'

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
      <MenuTextItem href="/about">About</MenuTextItem>
      <MenuTextItem href="/statistics">Statistics</MenuTextItem>
      <MenuButton onClick={openMenu} />
      {isMenuOpen && <MenuModal onClose={closeMenu} />}
    </>
  )
}

const MenuItem = ({ href, children }) => (
  <Link
    href={href}
    css={css`
      font-size: 24px;
      font-weight: 700;
      color: var(--text-inverse-color);
      padding: 12px 24px;
      text-decoration: none;
      text-align: center;
    `}
    className={headerFont.className}
  >
    {children}
  </Link>
)

const MenuTextItem = ({ href, children }) => (
  <Link
    href={href}
    css={css`
      font-size: 18px;
      font-weight: 700;
      color: var(--text-inverse-color);
      text-decoration: none;

      @media (max-width: 600px) {
        display: none;
      }
    `}
    className={headerFont.className}
  >
    {children}
  </Link>
)

const MenuButton = ({ onClick }) => (
  <div
    css={css`
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-sizing: border-box;
      cursor: pointer;

      @media (min-width: 600px) {
        display: none;
      }
    `}
    onClick={onClick}
  >
    <MenuIcon />
  </div>
)

const MenuModal = ({ onClose }) => {
  useKeypress('Escape', onClose)

  return (
    <div
      css={css`
        top: 0;
        left: 0;
        bottom: 0;
        right: 0;
        position: fixed;
        background-color: var(--background-inverse-color);
        z-index: 1;
      `}
      onClick={onClose}
    >
      <Layout>
        <div
          css={css`
            position: relative; /* so the MenuCloseButton can position itself */
            display: flex;
            flex-direction: column;
            padding-top: 64px;
          `}
        >
          <MenuCloseButton onClick={onClose} />
          <MenuItem href="/">Home</MenuItem>
          <MenuItem href="/about">About</MenuItem>
          <MenuItem href="/statistics">Statistics</MenuItem>
        </div>
      </Layout>
    </div>
  )
}

const MenuCloseButton = ({ onClick }) => (
  <div
    css={css`
      position: absolute;
      top: 28px;
      right: 0;
      width: 32px;
      height: 32px;
      box-sizing: border-box;
      cursor: pointer;

      display: flex;
      align-items: center;
      justify-content: center;
    `}
    onClick={onClick}
  >
    <CrossIcon color="var(--text-inverse-color)" />
  </div>
)

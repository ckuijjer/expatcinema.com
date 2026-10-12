'use client'

import Link from 'next/link'
import React, { useEffect, useState } from 'react'

import { css, cx } from 'styled-system/css'

import { useSearch, useShortcut } from '../utils/hooks'
import { headerFont } from '../utils/theme'
import {
  iconBoxStyle,
  iconButtonStyle,
  iconLabelStyle,
} from './iconButtonStyles'
import { Menu } from './Menu'
import { TextFilter } from './TextFilter'
import CrossIcon from './icons/CrossIcon'
import SearchIcon from './icons/SearchIcon'

const containerStyle = css({
  display: 'flex',
  alignItems: 'center',
  color: 'var(--text-inverse-color)',
  backgroundColor: 'var(--background-inverse-color)',
  height: '88px',
})

const titleContainerStyle = css({
  flex: '1',
  marginRight: '8px',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
})

const titleLinkStyle = css({
  color: 'inherit',
  textDecoration: 'none',
})

const titleStyle = css({
  fontSize: '24px',
  marginTop: '0',
  marginBottom: '4px',
  fontStyle: 'normal',
  fontWeight: '700',
  lineHeight: 'normal',
})

const subtitleStyle = css({
  fontSize: '14px',
  fontWeight: '400',
  marginTop: '0',
  marginBottom: '0',
  color: 'var(--text-inverse-muted-color)',
})

const navigationItemsStyle = css({
  flex: '0',
  display: 'flex',
  gap: '24px',
  alignItems: 'center',
})

export const NavigationBar = ({ showSearch = true }) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const { search, setSearch } = useSearch()

  useEffect(() => {
    setIsSearchOpen(search !== '')
  }, [search])

  const openSearch = () => {
    setIsSearchOpen(true)
  }

  const closeSearch = () => {
    setIsSearchOpen(false)
  }

  const toggleSearch = () => {
    if (isSearchOpen) {
      setSearch('')
      closeSearch()
    } else {
      openSearch()
    }
  }

  // "/" toggles the search, unless it is typed in a field
  useShortcut(
    (e) => showSearch && e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey,
    toggleSearch,
  )

  // Cmd/Ctrl+K opens the search, or focuses it when it is already open
  useShortcut(
    (e) =>
      showSearch &&
      (e.metaKey || e.ctrlKey) &&
      !e.altKey &&
      !e.shiftKey &&
      e.key.toLowerCase() === 'k',
    () => {
      if (!isSearchOpen) return openSearch()

      const input = document.querySelector<HTMLInputElement>(
        'input[name="search"]',
      )
      input?.focus()
      input?.select()
    },
    { inInputs: true },
  )

  return (
    <>
      <div className={containerStyle}>
        <div className={titleContainerStyle}>
          {isSearchOpen ? (
            <TextFilter />
          ) : (
            <Link href="/" className={titleLinkStyle}>
              <h1 className={cx(titleStyle, headerFont.className)}>
                Expat Cinema
              </h1>
              <h2 className={subtitleStyle}>
                Foreign movies with English subtitles
              </h2>
            </Link>
          )}
        </div>
        <div className={navigationItemsStyle}>
          {showSearch && (
            <button
              type="button"
              className={iconButtonStyle}
              onClick={toggleSearch}
              aria-label={isSearchOpen ? 'Close search' : 'Search'}
            >
              <span className={iconBoxStyle}>
                {isSearchOpen ? <CrossIcon /> : <SearchIcon />}
              </span>
              <span className={iconLabelStyle}>
                {isSearchOpen ? 'Close' : 'Search'}
              </span>
            </button>
          )}
          <Menu />
        </div>
      </div>
    </>
  )
}

'use client'

import Link from 'next/link'
import React, { useEffect, useState } from 'react'

import { css, cx } from 'styled-system/css'

import { useKeypress, useSearch } from '../utils/hooks'
import { headerFont } from '../utils/theme'
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

const searchButtonStyle = css({
  width: '32px',
  height: '32px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxSizing: 'border-box',
  cursor: 'pointer',
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

  useKeypress('/', () => toggleSearch())

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
            <div className={searchButtonStyle} onClick={toggleSearch}>
              {isSearchOpen ? <CrossIcon /> : <SearchIcon />}
            </div>
          )}
          <Menu />
        </div>
      </div>
    </>
  )
}

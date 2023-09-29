import React, { useState, useEffect } from 'react'
import { css } from '@emotion/react'
import Link from 'next/link'

import SearchIcon from './icons/search.svg'
import CrossIcon from './icons/cross.svg'

import { headerFont } from '../utils/theme'
import { TextFilter } from './TextFilter'
import { Menu } from './Menu'

import { useSearch } from '../utils/hooks'

const Title = (props) => (
  <h1
    css={css`
      font-size: 24px;
      margin-top: 0;
      margin-bottom: 4px;
      font-style: normal;
      font-weight: 700;
      line-height: normal;
    `}
    className={headerFont.className}
    {...props}
  />
)

const SubTitle = (props) => (
  <h2
    css={css`
      font-size: 14px;
      font-weight: 400;
      margin-top: 0;
      margin-bottom: 0;
      color: var(--text-inverse-muted-color);
    `}
    {...props}
  />
)

const SearchButton = ({ hidden, onClick, isSearchOpen }) => {
  if (hidden) return null

  return (
    <div
      css={css`
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-sizing: border-box;
        cursor: pointer;
      `}
      onClick={onClick}
    >
      {isSearchOpen ? <CrossIcon /> : <SearchIcon />}
    </div>
  )
}

const Container = (props) => (
  <div
    css={css`
      display: flex;
      align-items: center;
      color: var(--text-inverse-color);
      background-color: var(--background-inverse-color);
      height: 88px;
    `}
    {...props}
  />
)

const TitleContainer = (props) => (
  <div
    css={css`
      flex: 1;
      margin-right: 8px; // 24px is better, but 8px makes the layout fit on a iPhone SE
      display: flex;
      flex-direction: column;
      justify-content: center;
    `}
    {...props}
  />
)

const NavigationItems = (props) => (
  <div
    css={css`
      flex: 0;
      display: flex;
      gap: 24px;
      align-items: center;
    `}
    {...props}
  />
)

export const NavigationBar = ({ showSearch = true }) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const { search, setSearch } = useSearch()

  useEffect(() => {
    const isOpen = search !== ''
    setIsSearchOpen(isOpen)
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

  return (
    <>
      <Container>
        <TitleContainer>
          {isSearchOpen ? (
            <TextFilter />
          ) : (
            <Link
              href="/"
              css={css`
                color: inherit;
                text-decoration: none;
              `}
            >
              <Title>Expat Cinema</Title>
              <SubTitle>Foreign movies with English subtitles</SubTitle>
            </Link>
          )}
        </TitleContainer>
        <NavigationItems>
          <SearchButton
            hidden={!showSearch}
            isSearchOpen={isSearchOpen}
            onClick={toggleSearch}
          />
          <Menu />
        </NavigationItems>
      </Container>
    </>
  )
}

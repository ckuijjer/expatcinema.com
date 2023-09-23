import React, { useState, useEffect } from 'react'
import { css } from '@emotion/react'
import Link from 'next/link'
import { headerFont } from '../utils/theme'

import SearchIcon from './icons/search.svg'
import MenuIcon from './icons/menu.svg'
import CrossIcon from './icons/cross.svg'
import TextFilter from './TextFilter'
import Layout from './Layout'

import { useKeypress, useSearch } from '../utils/hooks'

const Title = (props) => (
  <h1
    css={css({
      fontSize: 24,
      marginTop: 0,
      marginBottom: 4,
      fontStyle: 'normal',
      fontWeight: 700,
      lineHeight: 'normal',
    })}
    className={headerFont.className}
    {...props}
  />
)

const SubTitle = (props) => (
  <h2
    css={css({
      fontSize: 14,
      fontWeight: 400,
      marginTop: 0,
      marginBottom: 0,
      color: 'var(--text-muted-color)',
    })}
    {...props}
  />
)

const IconButton = (props) => (
  <div
    css={css({
      width: 32,
      height: 32,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxSizing: 'border-box',
      cursor: 'pointer',
    })}
    {...props}
  />
)

const Menu = ({ onClose }) => {
  useKeypress('Escape', onClose)

  return (
    <div
      css={css({
        top: 0,
        left: 0,
        bottom: 0,
        right: 0,
        position: 'fixed',
        backgroundColor: 'var(--background-menu-color)',
      })}
      onClick={onClose}
    >
      <Layout>
        <div
          css={css({
            position: 'relative', // so the MenuCloseButton can position itself
            display: 'flex',
            flexDirection: 'column',
            paddingTop: 64,
          })}
        >
          <MenuCloseButton onClose={onClose} />
          <MenuItem href="/">Home</MenuItem>
          <MenuItem href="/about">About</MenuItem>
          <MenuItem href="/statistics">Statistics</MenuItem>
        </div>
      </Layout>
    </div>
  )
}

const MenuCloseButton = ({ onClose }) => (
  <div
    css={css({
      position: 'absolute',
      top: 28,
      right: 0,
      width: 32,
      height: 32,
      boxSizing: 'border-box',
      cursor: 'pointer',
    })}
  >
    <CloseButton onClose={onClose} />
  </div>
)

const CloseButton = ({ onClose }) => (
  <IconButton onClick={onClose}>
    <CrossIcon color="var(--text-menu-color)" />
  </IconButton>
)

const MenuItem = ({ href, children }) => (
  <Link
    href={href}
    css={css({
      fontSize: 24,
      fontWeight: 700,
      color: 'var(--text-menu-color)',
      padding: '12px 24px',
      cursor: 'pointer',
      textDecoration: 'none',
      textAlign: 'center',
    })}
    className={headerFont.className}
  >
    {children}
  </Link>
)

const Container = (props) => (
  <div
    css={css({
      display: 'flex',
      alignItems: 'center',
      paddingTop: 16,
      paddingBottom: 16,
    })}
    {...props}
  />
)

const TitleContainer = (props) => (
  <div
    css={css`
      flex: 1;
      margin-right: 16px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      height: 52px;
    `}
    {...props}
  />
)

const IconContainer = (props) => (
  <div
    css={css({
      flex: 0,
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 32px)',
      gridGap: 16,
    })}
    {...props}
  />
)

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const { search, setSearch } = useSearch()

  useEffect(() => {
    const isOpen = search !== ''
    setIsSearchOpen(isOpen)
  }, [search])

  const openMenu = () => {
    setIsMenuOpen(true)
  }

  const closeMenu = () => {
    setIsMenuOpen(false)
  }

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
        <IconContainer>
          <IconButton onClick={toggleSearch}>
            {isSearchOpen ? <CrossIcon /> : <SearchIcon />}
          </IconButton>
          <IconButton onClick={openMenu}>
            <MenuIcon />
          </IconButton>
        </IconContainer>
      </Container>
      {isMenuOpen && <Menu onClose={closeMenu} />}
    </>
  )
}

export default Header

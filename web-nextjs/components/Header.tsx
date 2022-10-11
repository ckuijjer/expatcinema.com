import React, { useState } from 'react'
import { css } from '@emotion/react'
import Link from 'next/link'

const Title = (props) => (
  <h1
    css={css({
      fontSize: 40,
      marginTop: 0,
      marginBottom: 0,
    })}
    {...props}
  />
)

const SubTitle = (props) => (
  <h2
    css={css({
      fontSize: 24,
      marginTop: 0,
      marginBottom: 0,
    })}
    {...props}
  />
)

const Menu = ({ isOpen }) => {
  return isOpen ? (
    <div
      css={css({
        marginLeft: -16,
        marginTop: 24,
      })}
    >
      <MenuItem href="/">Home</MenuItem>
      <MenuItem href="/about">About</MenuItem>
      <MenuItem href="/statistics">Statistics</MenuItem>
    </div>
  ) : null
}

const MenuItem = ({ href, children, isCurrent }) => (
  <Link href={href} passHref>
    <a
      css={css({
        display: 'inline-block',
        fontSize: 24,
        color: isCurrent ? 'var(--primary-color)' : 'var(--text-muted-color)',
        padding: '12px 16px',
        cursor: 'pointer',
        textDecoration: 'none',
      })}
    >
      {children}
    </a>
  </Link>
)

const Header = () => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div
      css={css({
        marginBottom: 24,
        cursor: 'pointer',
      })}
      onClick={() => {
        setIsOpen(!isOpen)
      }}
    >
      <Title>Expat Cinema</Title>
      <SubTitle>Foreign movies with English subtitles</SubTitle>
      <Menu isOpen={isOpen} />
    </div>
  )
}

export default Header

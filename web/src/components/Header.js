import React, { useState } from 'react'
import { css } from '@emotion/react'
import { Link } from 'gatsby'

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
      <MenuItem to="/">Home</MenuItem>
      <MenuItem to="/about">About</MenuItem>
      <MenuItem to="/analytics">Analytics</MenuItem>
    </div>
  ) : null
}

const MenuItem = (props) => (
  <Link
    css={css({
      display: 'inline-block',
      fontSize: 24,
      color: props.isCurrent
        ? 'var(--primary-color)'
        : 'var(--text-muted-color)',
      padding: '12px 16px',
      cursor: 'pointer',
      textDecoration: 'none',
    })}
    {...props}
  />
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

import React from 'react'
import { css } from '@emotion/react'
import { Link } from 'gatsby'

const Title = (props) => (
  <h1
    css={css({
      fontSize: 40,
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
      marginBottom: 24,
    })}
    {...props}
  />
)

const Header = () => (
  <Link
    to="/"
    css={css`
      text-decoration: none;
      color: inherit;
    `}
  >
    <Title>Expat Cinema</Title>
    <SubTitle>Foreign movies with English subtitles</SubTitle>
  </Link>
)

export default Header

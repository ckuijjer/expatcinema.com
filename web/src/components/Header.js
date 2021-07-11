import React from 'react'
import styled from '@emotion/styled'
import { css } from '@emotion/react'
import { Link } from 'gatsby'

const Title = styled('h1')({
  fontSize: 40,
  marginBottom: 0,
})

const SubTitle = styled('h2')({
  fontSize: 24,
  marginTop: 0,
  marginBottom: 24,
})

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

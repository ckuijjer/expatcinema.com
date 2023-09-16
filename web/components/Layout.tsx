import React from 'react'
import { css } from '@emotion/react'

const Container = ({ inverse = false, ...props }) => (
  <div
    css={css({
      backgroundColor: inverse
        ? 'var(--background-inverse-color)'
        : 'transparent',
    })}
    {...props}
  />
)

const Content = (props) => (
  <div
    css={css({
      margin: '0 auto',

      paddingLeft: 16,
      paddingRight: 16,
      maxWidth: 960,
    })}
    {...props}
  />
)

const Layout = ({ inverse = false, children }) => {
  return (
    <Container inverse={inverse}>
      <Content>{children}</Content>
    </Container>
  )
}

export default Layout

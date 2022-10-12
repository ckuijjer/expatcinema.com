import React from 'react'
import { css } from '@emotion/react'

import { Settings } from 'luxon'

Settings.defaultZone = 'Europe/Amsterdam'

const Container = (props) => (
  <div
    css={css({
      marginTop: 32,
      marginBottom: 32,
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

const Layout = ({ children }) => (
  <Container>
    <Content>{children}</Content>
  </Container>
)

export default Layout

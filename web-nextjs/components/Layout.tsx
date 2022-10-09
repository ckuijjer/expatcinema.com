import React from 'react'
import { css } from '@emotion/react'
// import { Location, globalHistory } from '@reach/router'
// import { QueryParamProvider } from 'use-query-params'

import { Settings } from 'luxon'

Settings.defaultZone = 'Europe/Amsterdam'

// You have tried to stringify object returned from `css` function. It isn't supposed to be used directly
// (e.g. as value of the `className` prop), but rather handed to emotion so it can handle it (e.g. as value of `css` prop).

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
  <>
    <Container>
      <Content>{children}</Content>
    </Container>
  </>
)

// const Layout = ({ children }) => (
//   <Location>
//     {({ location }) => (
//       <QueryParamProvider location={location} reachHistory={globalHistory}>
//         <Global styles={globalStyles} />
//         <Container>
//           <Content>{children}</Content>
//         </Container>
//       </QueryParamProvider>
//     )}
//   </Location>
// )

export default Layout

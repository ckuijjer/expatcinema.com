import React from 'react'
import { Global, css } from '@emotion/react'
import { Location, globalHistory } from '@reach/router'
import { QueryParamProvider } from 'use-query-params'

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

const globalStyles = css`
  body {
    margin: 0;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto',
      'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans',
      'Helvetica Neue', sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;

    --text-color: #333;
    --text-muted-color: #888;
    --background-color: #fff;
    --background-highlight-color: #f6f6f6;
    --primary-color: #0650d0;

    @media (prefers-color-scheme: dark) {
      --text-color: #eee;
      --text-muded-color: #555;
      --background-color: #121212;
      --background-highlight-color: #1f1f1f;
    }

    background-color: var(--background-color);
    color: var(--text-color);
  }
`

const App = ({ children }) => (
  <Location>
    {({ location }) => (
      <QueryParamProvider location={location} reachHistory={globalHistory}>
        <Global styles={globalStyles} />
        <Container>
          <Content>{children}</Content>
        </Container>
      </QueryParamProvider>
    )}
  </Location>
)

export default App

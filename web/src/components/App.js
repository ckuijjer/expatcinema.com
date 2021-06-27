import React from 'react'
import styled from '@emotion/styled'
import { Global, css } from '@emotion/react'
import { Location, globalHistory } from '@reach/router'
import { QueryParamProvider } from 'use-query-params'

import { Settings } from 'luxon'

import Calendar from './Calendar'
import TextFilter from './TextFilter'
import CityFilter from './CityFilter'
import Header from './Header'

import { LocalStorageProvider } from '../hooks'

Settings.defaultZoneName = 'Europe/Amsterdam'

const Container = styled('div')({})

const Content = styled('div')({
  margin: '0 auto',

  paddingLeft: 16,
  paddingRight: 16,
  maxWidth: 960,
})

const globalStyles = css`
  body {
    margin: 0;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto',
      'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans',
      'Helvetica Neue', sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    color: #333;
  }
`

const App = () => (
  <Location>
    {({ location }) => (
      <QueryParamProvider location={location} reachHistory={globalHistory}>
        <LocalStorageProvider>
          <Global styles={globalStyles} />
          <Container>
            <Content>
              <Header />
              <TextFilter />
              <CityFilter />
              <Calendar />
            </Content>
          </Container>
        </LocalStorageProvider>
      </QueryParamProvider>
    )}
  </Location>
)

export default App

import React from 'react'
import styled from '@emotion/styled'
import ReactGA from 'react-ga'
import { Settings } from 'luxon'

import Calendar from './Calendar'
import TextFilter from './TextFilter'
import CityFilter from './CityFilter'
import Header from './Header'

import { LocalStorageProvider, URLSearchParamsProvider } from './hooks'

Settings.defaultZoneName = 'Europe/Amsterdam'

ReactGA.initialize('UA-127056408-1')
ReactGA.pageview(window.location.pathname + window.location.search)

const Container = styled('div')({})

const Content = styled('div')({
  margin: '0 auto',

  paddingLeft: 16,
  paddingRight: 16,
  maxWidth: 960,
})

const App = () => (
  <LocalStorageProvider>
    <URLSearchParamsProvider>
      <Container>
        <Content>
          <Header />
          <TextFilter />
          <CityFilter />
          <Calendar />
        </Content>
      </Container>
    </URLSearchParamsProvider>
  </LocalStorageProvider>
)

export default App

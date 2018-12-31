import React from 'react'
import styled from 'react-emotion'
import ReactGA from 'react-ga'

// import About from './About'
import Calendar from './Calendar'
import TextFilter from './TextFilter'
import CityFilter from './CityFilter'
import Header from './Header'

import { LocalStorageProvider } from './hooks'

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
  <>
    <LocalStorageProvider>
      <Container>
        <Content>
          <Header />
          <TextFilter />
          <CityFilter />
          <Calendar />
        </Content>
      </Container>
      {/* <Container style={{ backgroundColor: '#fbfbfb' }}>
          <Content>
            <About />
          </Content>
        </Container> */}
    </LocalStorageProvider>
  </>
)

export default App

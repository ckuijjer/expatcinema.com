import React from 'react'
import styled from 'react-emotion'
import ReactGA from 'react-ga'

ReactGA.initialize('UA-127056408-1')
ReactGA.pageview(window.location.pathname + window.location.search)

// import About from './About'
import Calendar from './Calendar'
import TextFilter from './TextFilter'
import CityFilter from './CityFilter'
import Header from './Header'

const Container = styled('div')({})

const Content = styled('div')({
  margin: '0 auto',

  paddingLeft: 16,
  paddingRight: 16,
  maxWidth: 960,
})

const App = () => (
  <>
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
  </>
)

export default App

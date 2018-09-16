import React from 'react'
import styled from 'react-emotion'
import About from './About'
import Calendar from './Calendar'
import Header from './Header'

const Container = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
})

const Content = styled('div')({
  marginLeft: 20,
  marginRight: 20,
  maxWidth: 900,
})

const AboutContainer = styled('div')({
  backgroundColor: '#fbfbfb',
  paddingLeft: 20,
  paddingRight: 20,
  alignSelf: 'stretch',
})

const App = () => (
  <Container>
    <Content>
      <Header />
      <Calendar />
    </Content>
    <AboutContainer>
      <About />
    </AboutContainer>
  </Container>
)

export default App

import React from 'react'
import styled from 'react-emotion'
import Calendar from './Calendar'
import Header from './Header'

const Container = styled('div')({
  display: 'flex',
  justifyContent: 'center',
})

const InnerContainer = styled('div')({
  marginLeft: 20,
  marginRight: 20,
  width: 900,
})

const App = () => (
  <Container>
    <InnerContainer>
      <Header />
      <Calendar />
    </InnerContainer>
  </Container>
)

export default App

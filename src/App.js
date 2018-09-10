import React, { Component } from 'react'
import styled from 'react-emotion'
import Calendar from './Calendar'
import Header from './Header'

const Container = styled('div')({
  marginLeft: 40,
  marginRight: 40,
})

const App = () => (
  <Container>
    <Header />
    <Calendar />
  </Container>
)

export default App

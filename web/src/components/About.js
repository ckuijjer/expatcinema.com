import React from 'react'
import styled from '@emotion/styled'
import Header from './Header'

const Container = styled('div')({
  marginTop: 16,
  paddingTop: 16,
  paddingBottom: 16,
  lineHeight: 1.4,
})

const About = () => (
  <>
    <Header />
    <Container>
      ExpatCinema uses a combination of automated and manual techniques to find
      english subtitled movie screenings at the following cinemas.
      <br />
      <br />
      Amsterdam: Eye, Kriterion, Lab111
      <br />
      Den Haag: Filmhuis Den Haag
      <br />
      Leiden: Kijkhuis
      <br />
      Rotterdam: Kino, Lantarenvenster
      <br />
    </Container>
  </>
)

export default About

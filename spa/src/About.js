import React from 'react'
import styled from 'react-emotion'

const Container = styled('div')({
  marginTop: 20,
  marginBottom: 20,
  color: '#999',
  lineHeight: 1.4,
})

const About = () => (
  <Container>
    Expat Cinema uses a combination of automated and manual techniques to find
    english subtitled movie screenings at the following cinemas. Amsterdam: Eye,
    Lab111 - Den Haag: Filmhuis Den Haag - Leiden: Kijkhuis - Rotterdam: Kino,
    Lantarenvenster.
  </Container>
)

export default About

import React from 'react'
import Header from './Header'
import { css } from '@emotion/react'

const Container = (props) => (
  <div
    css={css({
      marginTop: 16,
      paddingTop: 16,
      paddingBottom: 16,
      fontSize: 20,
      lineHeight: 1.4,
    })}
    {...props}
  />
)

const About = () => (
  <>
    <Header />
    <Container>
      ExpatCinema uses a combination of automated and manual techniques to find
      english subtitled movie screenings at the following cinemas.
      <br />
      <br />
      Amsterdam: Cinecenter, Eye, Kriterion, Lab111, Rialto
      <br />
      Delft: Filmhuis Lumen
      <br />
      Den Haag: Filmhuis Den Haag
      <br />
      Groningen: Forum Groningen
      <br />
      Leiden: Kijkhuis
      <br />
      Rotterdam: Kino, Lantarenvenster
      <br />
    </Container>
  </>
)

export default About

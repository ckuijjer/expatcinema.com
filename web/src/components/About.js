import React from 'react'
import Header from './Header'
import { css } from '@emotion/react'
import { Link } from 'gatsby'

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

const About = () => {
  const linkStyle = css({
    color: 'var(--text-muted-color)',
    cursor: 'pointer',
    textDecoration: 'none',
  })

  return (
    <>
      <Header />
      <Container>
        ExpatCinema uses a combination of automated and manual techniques to
        find english subtitled movie screenings at the following cinemas.
        <br />
        <br />
        <Link to="/city/amsterdam" css={linkStyle}>
          Amsterdam
        </Link>
        : Cinecenter, Eye, Ketelhuis, Kriterion, Lab111, Rialto, Studio/K
        <br />
        <Link to="/city/delft" css={linkStyle}>
          Delft
        </Link>
        : Filmhuis Lumen
        <br />
        <Link to="/city/den haag" css={linkStyle}>
          Den Haag
        </Link>
        : Filmhuis Den Haag
        <br />
        <Link to="/city/groningen" css={linkStyle}>
          Groningen
        </Link>
        : Forum Groningen
        <br />
        <Link to="/city/leiden" css={linkStyle}>
          Leiden
        </Link>
        : Kijkhuis
        <br />
        <Link to="/city/rotterdam" css={linkStyle}>
          Rotterdam
        </Link>
        : Kino, Lantarenvenster
        <br />
      </Container>
    </>
  )
}

export default About

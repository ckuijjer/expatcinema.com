import React from 'react'
import Header from './Header'
import { css } from '@emotion/react'
import Link from 'next/link'

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
        <Link href="/city/amsterdam" css={linkStyle}>
          Amsterdam
        </Link>
        : Cinecenter, Eye, Ketelhuis, Kriterion, Lab111, Rialto, Studio/K
        <br />
        <Link href="/city/delft" css={linkStyle}>
          Delft
        </Link>
        : Filmhuis Lumen
        <br />
        <Link href="/city/den haag" css={linkStyle}>
          Den Haag
        </Link>
        : Filmhuis Den Haag
        <br />
        <Link href="/city/groningen" css={linkStyle}>
          Groningen
        </Link>
        : Forum Groningen
        <br />
        <Link href="/city/leiden" css={linkStyle}>
          Leiden
        </Link>
        : Kijkhuis
        <br />
        <Link href="/city/rotterdam" css={linkStyle}>
          Rotterdam
        </Link>
        : Kino, Lantarenvenster
        <br />
        <p>
          Contact us at{' '}
          <a href="mailto:info@expatcinema.com">info@expatcinema.com</a>
        </p>
      </Container>
    </>
  )
}

export default About

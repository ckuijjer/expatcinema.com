import React from 'react'
import { NavigationBar } from './NavigationBar'
import { css } from '@emotion/react'
import Link from 'next/link'
import { Layout } from './Layout'
import { headerFont, palette } from '../utils/theme'
import { PageTitle } from './PageTitle'

const Container = (props) => (
  <div
    css={css`
      padding-bottom: 16px;
      font-size: 18px;
      line-height: 1.4;
    `}
    {...props}
  />
)

const cityLink = css`
  color: var(--text-color);
  font-weight: 700;
  cursor: pointer;
  text-decoration: none;
`

const textLinkStyle = css`
  color: var(--secondary-color);
`
export const About = () => {
  return (
    <>
      <Layout backgroundColor={palette.purple600}>
        <NavigationBar showSearch={false} />
      </Layout>
      <Layout>
        <PageTitle>About</PageTitle>
        <Container>
          <p>
            ExpatCinema uses a combination of automated and manual techniques to
            find English subtitled movie screenings at the following cinemas.
          </p>
          <p>
            Note that this means there's unfortunately no guarantee that the
            screenings are actually with English subtitles, so please check the
            cinema's website before going.
          </p>
          <p>
            If you know of other cinemas that show English subtitled movies, if
            you find there's screenings missing, or if you find any mistakes,
            please let us know at{' '}
            <Link href="mailto:info@expatcinema.com" css={textLinkStyle}>
              info@expatcinema.com
            </Link>
          </p>
          <br />
          <Link href="/city/amsterdam" css={cityLink}>
            Amsterdam
          </Link>
          : Cinecenter, Eye, Ketelhuis, Kriterion, Lab111, Rialto De Pijp,
          Rialto VU, The Movies VU, Studio/K, De Uitkijk
          <br />
          <Link href="/city/delft" css={cityLink}>
            Delft
          </Link>
          : Filmhuis Lumen
          <br />
          <Link href="/city/den haag" css={cityLink}>
            Den Haag
          </Link>
          : Filmhuis Den Haag
          <br />
          <Link href="/city/groningen" css={cityLink}>
            Groningen
          </Link>
          : Forum Groningen
          <br />
          <Link href="/city/haarlem" css={cityLink}>
            Haarlem
          </Link>
          : Schuur
          <br />
          <Link href="/city/leiden" css={cityLink}>
            Leiden
          </Link>
          : Kijkhuis, Lido, Trianon
          <br />
          <Link href="/city/maastricht" css={cityLink}>
            Maastricht
          </Link>
          : Lumière
          <br />
          <Link href="/city/rotterdam" css={cityLink}>
            Rotterdam
          </Link>
          : Kino, Lantarenvenster
          <br />
          <Link href="/city/tilburg" css={cityLink}>
            Tilburg
          </Link>
          : Cinecitta
          <br />
          <Link href="/city/utrecht" css={cityLink}>
            Utrecht
          </Link>
          : Louis Hartlooper Complex, Slachtstraat, Springhaver
          <br />
          <p>
            Contact us at{' '}
            <Link href="mailto:info@expatcinema.com" css={textLinkStyle}>
              info@expatcinema.com
            </Link>
          </p>
        </Container>
      </Layout>
    </>
  )
}

import { css } from '@emotion/react'
import Link from 'next/link'
import React from 'react'

import cinemas from '../data/cinema.json'
import { headerFont, palette } from '../utils/theme'
import { Layout } from './Layout'
import { NavigationBar } from './NavigationBar'
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

const cities = [...new Set(cinemas.map((cinema) => cinema.city))].sort()

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
          {cities.map((city) => {
            const href = `/city/${city.toLowerCase()}`
            const cinemasInCity = cinemas
              .filter((cinema) => cinema.city === city)
              .sort((a, b) => a.name.localeCompare(b.name))

            return (
              <>
                <Link href={href} css={cityLink}>
                  {city}
                </Link>
                :{' '}
                {cinemasInCity.map((cinema, i, arr) => {
                  const isLast = i === arr.length - 1
                  return (
                    <>
                      <Link href={cinema.url} css={textLinkStyle}>
                        {cinema.name}
                      </Link>
                      {isLast ? '' : ', '}
                    </>
                  )
                })}
                <br />
              </>
            )
          })}
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

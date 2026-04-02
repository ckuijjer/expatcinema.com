import Link from 'next/link'
import React from 'react'

import { css } from 'styled-system/css'

import cinemas from '../data/cinema.json'
import { palette } from '../utils/theme'
import { Layout } from './Layout'
import { NavigationBar } from './NavigationBar'
import { PageTitle } from './PageTitle'

const containerStyle = css({
  paddingBottom: '16px',
  fontSize: '18px',
  lineHeight: '1.4',
})

const cityLinkStyle = css({
  color: 'var(--text-color)',
  fontWeight: '700',
  cursor: 'pointer',
  textDecoration: 'none',
})

const textLinkStyle = css({
  color: 'var(--secondary-color)',
})

const cities = [...new Set(cinemas.map((cinema) => cinema.city))].sort()

export const About = () => {
  return (
    <>
      <Layout backgroundColor={palette.purple600}>
        <NavigationBar showSearch={false} />
      </Layout>
      <Layout>
        <PageTitle>About</PageTitle>
        <div className={containerStyle}>
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
            <Link href="mailto:info@expatcinema.com" className={textLinkStyle}>
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
                <Link href={href} className={cityLinkStyle}>
                  {city}
                </Link>
                :{' '}
                {cinemasInCity.map((cinema, i, arr) => {
                  const isLast = i === arr.length - 1
                  return (
                    <>
                      <Link href={cinema.url} className={textLinkStyle}>
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
            <Link href="mailto:info@expatcinema.com" className={textLinkStyle}>
              info@expatcinema.com
            </Link>
          </p>
        </div>
      </Layout>
    </>
  )
}

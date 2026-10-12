import Link from 'next/link'
import React from 'react'

import { css } from 'styled-system/css'

import cinemas from '../data/cinema.json'
import { getCity } from '../utils/getCity'
import { getScreenings } from '../utils/getScreenings'
import { Layout } from './Layout'
import { NavigationBar } from './NavigationBar'
import { PageTitle } from './PageTitle'
import { PageSection } from './PageSection'
import { ExternalLink } from './ExternalLink'
import { ExternalLinkIcon } from './ExternalLinkIcon'
import { TmdbLogo } from './TmdbLogo'

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
  textDecoration: 'underline',
  textUnderlineOffset: '2px',
  '&:hover': {
    opacity: '0.75',
  },
})

const cinemaLinkStyle = css({
  color: 'var(--secondary-color)',
  textDecoration: 'underline',
  textUnderlineOffset: '2px',
  '&:hover': {
    opacity: '0.75',
  },
})

const quietCinemaLinkStyle = css({
  color: 'var(--text-subtle-color)',
  textDecoration: 'underline',
  textUnderlineOffset: '2px',
  '&:hover': {
    opacity: '0.75',
  },
})

const websiteLinkStyle = css({
  color: 'var(--text-subtle-color)',
})

const tmdbAttributionStyle = css({
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  lineHeight: '1.4',
})

const compareAlphabetically = (left: string, right: string) =>
  left.localeCompare(right, undefined, { sensitivity: 'base' })

const citySlugs = [...new Set(cinemas.map((cinema) => cinema.city))].sort(
  (left, right) =>
    compareAlphabetically(
      getCity(left)?.name ?? left,
      getCity(right)?.name ?? right,
    ),
)

export const About = async () => {
  const screenings = await getScreenings()
  const cinemasWithScreenings = new Set(
    screenings.map((screening) => screening.cinema.slug),
  )

  return (
    <>
      <Layout backgroundColor="var(--palette-purple-600)">
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
          <PageSection>Cinemas</PageSection>
          <p>
            Click a cinema to see its screenings. The arrow goes to the cinema's
            own website. Cinemas in grey have no screenings with English
            subtitles at the moment.
          </p>
          {citySlugs.map((city) => {
            const href = `/city/${city}`
            const cinemasInCity = cinemas
              .filter((cinema) => cinema.city === city)
              .sort((a, b) => compareAlphabetically(a.name, b.name))

            return (
              <React.Fragment key={city}>
                <Link href={href} className={cityLinkStyle}>
                  {getCity(city)?.name ?? city}
                </Link>
                :{' '}
                {cinemasInCity.map((cinema, i, arr) => {
                  const isLast = i === arr.length - 1
                  return (
                    <React.Fragment key={cinema.name}>
                      <Link
                        href={`${href}/cinema/${cinema.slug}`}
                        className={
                          cinemasWithScreenings.has(cinema.slug)
                            ? cinemaLinkStyle
                            : quietCinemaLinkStyle
                        }
                      >
                        {cinema.name}
                      </Link>
                      <a
                        href={cinema.url}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`${cinema.name} website`}
                        className={websiteLinkStyle}
                      >
                        <ExternalLinkIcon />
                      </a>
                      {isLast ? '' : ', '}
                    </React.Fragment>
                  )
                })}
                <br />
              </React.Fragment>
            )
          })}
          <PageSection>Contact</PageSection>
          <p>
            Contact us at{' '}
            <Link href="mailto:info@expatcinema.com" className={textLinkStyle}>
              info@expatcinema.com
            </Link>
          </p>
          <PageSection>Statistics</PageSection>
          <p>
            View{' '}
            <Link href="/statistics" className={textLinkStyle}>
              screening coverage statistics
            </Link>{' '}
            for an overview of scraper activity.
          </p>
          <PageSection>Attribution</PageSection>
          <div className={tmdbAttributionStyle}>
            <Link
              href="https://www.themoviedb.org/"
              target="_blank"
              rel="noreferrer"
              className={textLinkStyle}
            >
              <TmdbLogo />
            </Link>
            <p>
              Movie metadata and poster images are provided by{' '}
              <ExternalLink href="https://www.themoviedb.org/">
                TMDB
              </ExternalLink>
              . This product uses the TMDB API but is not endorsed or certified
              by TMDB.
            </p>
          </div>
        </div>
      </Layout>
    </>
  )
}

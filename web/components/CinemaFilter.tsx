'use client'

import React from 'react'

import { css } from 'styled-system/css'

import cinemas from '../data/cinema.json'
import { useSearch } from '../utils/hooks'
import { palette } from '../utils/theme'
import { ActiveLink } from './ActiveLink'
import { Container } from './CityFilter'

const containerOverrideStyle = css({
  display: 'flex',
  gap: '12px',
})

export const CinemaFilter = ({ currentCity }: { currentCity: string }) => {
  const { searchQuery } = useSearch()

  const cinemasInCity = cinemas.filter(
    (cinema) => cinema.city === currentCity,
  )

  const links = [
    { text: 'All', href: `/city/${currentCity}${searchQuery}` },
    ...cinemasInCity.map((cinema) => ({
      text: cinema.name,
      href: `/city/${currentCity}/cinema/${cinema.slug}${searchQuery}`,
    })),
  ]

  return (
    <Container
      className={containerOverrideStyle}
      style={{ backgroundColor: palette.purple300 }}
    >
      {links.map(({ text, href }) => (
        <ActiveLink
          href={href}
          key={text}
          activeColor={palette.purple100}
          activeBackgroundColor={palette.purple400}
          inactiveColor={palette.purple500}
        >
          {text}
        </ActiveLink>
      ))}
    </Container>
  )
}

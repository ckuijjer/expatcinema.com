'use client'

import React, { useEffect, useRef } from 'react'

import { useParams } from 'next/navigation'
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
  const { cinema } = useParams<{ cinema?: string }>()
  const linkRefs = useRef<Map<string, HTMLAnchorElement>>(new Map())

  const cinemasInCity = cinemas.filter((c) => c.city === currentCity)

  const links = [
    { text: 'All', slug: null, href: `/city/${currentCity}${searchQuery}` },
    ...cinemasInCity.map((c) => ({
      text: c.name,
      slug: c.slug,
      href: `/city/${currentCity}/cinema/${c.slug}${searchQuery}`,
    })),
  ]

  useEffect(() => {
    if (cinema) {
      linkRefs.current
        .get(cinema)
        ?.scrollIntoView({ inline: 'nearest', block: 'nearest' })
    }
  }, [cinema])

  return (
    <Container
      className={containerOverrideStyle}
      style={{ backgroundColor: palette.purple300 }}
    >
      {links.map(({ text, slug, href }) => (
        <ActiveLink
          ref={(el) => {
            if (slug === null) return
            if (el) linkRefs.current.set(slug, el)
            else linkRefs.current.delete(slug)
          }}
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

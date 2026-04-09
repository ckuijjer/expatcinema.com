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

export const CinemaFilter = () => {
  const { searchQuery } = useSearch()
  const { city, cinema } = useParams<{ city: string; cinema?: string }>()
  const linkRefs = useRef<Map<string, HTMLAnchorElement>>(new Map())

  const cinemasInCity = cinemas.filter((c) => c.city === city)

  const links = [
    { text: 'All', slug: null, href: `/city/${city}${searchQuery}` },
    ...cinemasInCity.map((c) => ({
      text: c.name,
      slug: c.slug,
      href: `/city/${city}/cinema/${c.slug}${searchQuery}`,
    })),
  ]

  useEffect(() => {
    if (!cinema) return
    const link = linkRefs.current.get(cinema)
    if (!link) return

    link.scrollIntoView({
      behavior: 'instant',
      block: 'nearest',
      inline: 'nearest',
    })
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

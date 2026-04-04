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

  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const link = cinema ? linkRefs.current.get(cinema) : null
    const container = containerRef.current
    if (!link || !container) return

    const linkRect = link.getBoundingClientRect()
    const containerRect = container.getBoundingClientRect()

    if (linkRect.left < containerRect.left) {
      container.scrollLeft += linkRect.left - containerRect.left
    } else if (linkRect.right > containerRect.right) {
      container.scrollLeft += linkRect.right - containerRect.right
    }
  }, [cinema])

  return (
    <Container
      ref={containerRef}
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

'use client'

import React, { useEffect, useRef } from 'react'

import { useParams } from 'next/navigation'
import { css } from 'styled-system/css'

import { useSearch } from '../utils/hooks'
import { palette } from '../utils/theme'
import { ActiveLink } from './ActiveLink'
import { Container, FilterLink } from './CityFilter'

const containerOverrideStyle = css({
  display: 'flex',
  gap: '12px',
})

export const CinemaFilter = ({ links }: { links: FilterLink[] }) => {
  const { searchQuery } = useSearch()
  const { city, cinema } = useParams<{ city: string; cinema?: string }>()
  const linkRefs = useRef<Map<string, HTMLAnchorElement>>(new Map())

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
      {links.map(({ text, slug }) => (
        <ActiveLink
          ref={(el) => {
            if (slug === null) return
            if (el) linkRefs.current.set(slug, el)
            else linkRefs.current.delete(slug)
          }}
          href={
            slug === null
              ? `/city/${city}${searchQuery}`
              : `/city/${city}/cinema/${slug}${searchQuery}`
          }
          key={slug ?? text}
          tone="dark"
        >
          {text}
        </ActiveLink>
      ))}
    </Container>
  )
}

'use client'

import React, { useEffect, useRef } from 'react'

import { useParams } from 'next/navigation'
import { css } from 'styled-system/css'

import { useSearch, useScrollFade } from '../utils/hooks'
import { ActiveLink } from './ActiveLink'
import { Container, FilterBarWrapper, FilterLink } from './CityFilter'

const containerOverrideStyle = css({
  display: 'flex',
  gap: '12px',
})

export const CinemaFilter = ({ links }: { links: FilterLink[] }) => {
  const { searchQuery } = useSearch()
  const { city, cinema } = useParams<{ city: string; cinema?: string }>()
  const linkRefs = useRef<Map<string, HTMLAnchorElement>>(new Map())
  const containerRef = useRef<HTMLDivElement>(null)
  const showFade = useScrollFade(containerRef)

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
    <FilterBarWrapper fadeColor="var(--palette-purple-300)" showFade={showFade}>
      <Container
        ref={containerRef}
        className={containerOverrideStyle}
        style={{ backgroundColor: 'var(--palette-purple-300)' }}
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
    </FilterBarWrapper>
  )
}

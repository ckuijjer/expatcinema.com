'use client'

import React, { useEffect, useRef } from 'react'

import { useParams } from 'next/navigation'

import { css, cx } from 'styled-system/css'

import { useSearch } from '../utils/hooks'
import { ActiveLink } from './ActiveLink'

const scrollerStyle = css({
  paddingLeft: '10px',
  whiteSpace: 'nowrap',
  overflowX: 'auto',
  // hide scrollbar visually while keeping scroll functionality
  scrollbarWidth: 'none',
  '&::-webkit-scrollbar': { display: 'none' },
})

const wrapperStyle = css({
  position: 'relative',
  overflow: 'hidden',
})

const fadeOverlayStyle = css({
  position: 'absolute',
  top: '0',
  right: '0',
  bottom: '0',
  width: '48px',
  pointerEvents: 'none',
})

export const FilterBarWrapper = ({
  children,
  fadeColor,
}: {
  children: React.ReactNode
  fadeColor: string
}) => (
  <div className={wrapperStyle}>
    {children}
    <div
      className={fadeOverlayStyle}
      style={{ background: `linear-gradient(to right, transparent, rgba(0,0,0,0.10) 50%, ${fadeColor})` }}
    />
  </div>
)

export const Container = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cx(scrollerStyle, className)} {...props} />
))
Container.displayName = 'Container'

export type FilterLink = {
  text: string
  slug: string | null
}

export const CityFilter = ({ links }: { links: FilterLink[] }) => {
  const { searchQuery } = useSearch()
  const { city } = useParams<{ city?: string }>()
  const linkRefs = useRef<Map<string, HTMLAnchorElement>>(new Map())

  useEffect(() => {
    if (!city) return
    const link = linkRefs.current.get(city)
    if (!link) return

    link.scrollIntoView({
      behavior: 'instant',
      block: 'nearest',
      inline: 'nearest',
    })
  }, [city])

  return (
    <FilterBarWrapper fadeColor="var(--secondary-color)">
      <Container
        className={css({
          display: 'flex',
          backgroundColor: 'var(--secondary-color)',
          gap: '12px',
        })}
      >
        {links.map(({ text, slug }) => (
          <ActiveLink
            ref={(el) => {
              if (slug === null) return
              if (el) linkRefs.current.set(slug, el)
              else linkRefs.current.delete(slug)
            }}
            href={
              slug === null ? `/${searchQuery}` : `/city/${slug}${searchQuery}`
            }
            key={slug ?? text}
            matchPrefix
          >
            {text}
          </ActiveLink>
        ))}
      </Container>
    </FilterBarWrapper>
  )
}

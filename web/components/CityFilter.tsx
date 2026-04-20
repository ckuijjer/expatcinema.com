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
})

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
  )
}

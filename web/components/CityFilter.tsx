'use client'

import React, { useEffect, useRef } from 'react'

import { useParams } from 'next/navigation'

import { css, cx } from 'styled-system/css'

import cities from '../data/city.json'
import { useSearch } from '../utils/hooks'
import { ActiveLink } from './ActiveLink'

const scrollerStyle = css({
  marginLeft: '-16px',
  marginRight: '-16px',
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

export const CityFilter = () => {
  const { searchQuery } = useSearch()
  const { city } = useParams<{ city?: string }>()
  const linkRefs = useRef<Map<string, HTMLAnchorElement>>(new Map())

  const links = [
    { text: 'All', slug: null, href: `/${searchQuery}` },
    ...cities.map(({ name, slug }) => ({
      text: name,
      slug,
      href: `/city/${slug}${searchQuery}`,
    })),
  ]

  useEffect(() => {
      if (city) {
        linkRefs.current.get(city)?.scrollIntoView({ inline: 'nearest', block: 'nearest' })
      }
  }, [city])

  return (
    <Container
      className={css({
        display: 'flex',
        backgroundColor: 'var(--secondary-color)',
        gap: '12px',
      })}
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
          matchPrefix
        >
          {text}
        </ActiveLink>
      ))}
    </Container>
  )
}

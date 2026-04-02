'use client'

import React, { useEffect, useRef } from 'react'

import { usePathname } from 'next/navigation'

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
  const pathname = usePathname()
  const containerRef = useRef<HTMLDivElement>(null)

  const links = [
    { text: 'All', href: `/${searchQuery}` },
    ...cities.map(({ name, slug }) => ({
      text: name,
      href: `/city/${slug}${searchQuery}`,
    })),
  ]

  useEffect(() => {
    const activeLink = containerRef.current?.querySelector<HTMLElement>(
      'a[data-active="true"]',
    )
    activeLink?.scrollIntoView({ inline: 'nearest', block: 'nearest' })
  }, [pathname])

  return (
    <Container
      ref={containerRef}
      className={css({
        display: 'flex',
        backgroundColor: 'var(--secondary-color)',
        gap: '12px',
      })}
    >
      {links.map(({ text, href }) => (
        <ActiveLink href={href} key={text} matchPrefix>
          {text}
        </ActiveLink>
      ))}
    </Container>
  )
}

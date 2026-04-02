'use client'

import React from 'react'

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

export const Container = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cx(scrollerStyle, className)} {...props} />
)

export const CityFilter = () => {
  const { searchQuery } = useSearch()

  const links = [
    { text: 'All', href: `/${searchQuery}` },
    ...cities.map(({ name, slug }) => ({
      text: name,
      href: `/city/${slug}${searchQuery}`,
    })),
  ]

  return (
    <Container
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

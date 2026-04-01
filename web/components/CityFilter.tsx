import { css } from '@emotion/react'
import React from 'react'

import cities from '../data/city.json'
import { useSearch } from '../utils/hooks'
import { ActiveLink } from './ActiveLink'

export const Container = (props: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    css={css`
      margin-left: -16px;
      margin-right: -16px;
      padding-left: 10px;
      white-space: nowrap;
      overflow-x: auto;
    `}
    {...props}
  />
)

export const CityFilter = () => {
  const { searchQuery } = useSearch()

  const links = [
    { text: 'All', href: `/${searchQuery}` },
    ...cities.map(({ name }) => ({
      text: name,
      href: `/city/${name.toLowerCase()}${searchQuery}`,
    })),
  ]

  return (
    <Container
      css={css`
        display: flex;
        background-color: var(--secondary-color);
        gap: 12px;
      `}
    >
      {links.map(({ text, href }) => (
        <ActiveLink href={href} key={text} matchPrefix>
          {text}
        </ActiveLink>
      ))}
    </Container>
  )
}

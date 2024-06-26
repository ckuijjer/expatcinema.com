import { css } from '@emotion/react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import React, { useEffect, useState } from 'react'

import cities from '../data/city.json'
import { useSearch } from '../utils/hooks'
import { palette } from '../utils/theme'

export const Container = (props) => (
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

const ActiveLink = ({ children, href, as, ...rest }) => {
  const { asPath, isReady } = useRouter()
  const [isCurrent, setIsCurrent] = useState(false)

  useEffect(() => {
    if (isReady) {
      // Using URL().pathname to get rid of query and hash
      const linkPathname = new URL((as || href) as string, location.href)
        .pathname

      const activePathname = new URL(asPath, location.href).pathname

      setIsCurrent(linkPathname === activePathname)
    }
  }, [asPath, isReady, children, as, href, rest])

  return (
    <Link
      href={href}
      key={children}
      css={css`
        display: inline-block;
        font-size: 18px;
        color: ${isCurrent ? palette.purple500 : 'var(--text-inverse-color)'};
        background-color: ${isCurrent ? 'var(--primary-color)' : 'transparent'};
        padding: 10px;
        margin-top: 8px;
        margin-bottom: 8px;
        cursor: pointer;
        text-decoration: none;
        border-radius: 4px;
      `}
    >
      {children}
    </Link>
  )
}

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
        <ActiveLink href={href} key={text}>
          {text}
        </ActiveLink>
      ))}
    </Container>
  )
}

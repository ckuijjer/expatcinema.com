import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { css } from '@emotion/react'
import cities from '../data/city.json'
import { useSearch } from '../utils/hooks'

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
        color: ${isCurrent
          ? 'var(--secondary-color)'
          : 'var(--text-inverse-color)'};
        background-color: ${isCurrent ? 'var(--primary-color)' : 'transparent'};
        padding: 10px;
        margin-top: 7px;
        margin-bottom: 7px;
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
        background-color: var(--secondary-color);
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

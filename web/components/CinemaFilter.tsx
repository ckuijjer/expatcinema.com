import { css } from '@emotion/react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import React, { useEffect, useState } from 'react'

import cinemas from '../data/cinema.json'
import { useSearch } from '../utils/hooks'
import { palette } from '../utils/theme'
import { Container } from './CityFilter'

const ActiveLink = ({
  children,
  href,
}: {
  children: React.ReactNode
  href: string
}) => {
  const { asPath, isReady } = useRouter()
  const [isCurrent, setIsCurrent] = useState(false)

  useEffect(() => {
    if (isReady) {
      const linkPathname = new URL(href, location.href).pathname
      const activePathname = new URL(asPath, location.href).pathname
      setIsCurrent(linkPathname === activePathname)
    }
  }, [asPath, isReady, href])

  return (
    <Link
      href={href}
      css={css`
        display: inline-block;
        font-size: 18px;
        color: ${isCurrent ? palette.purple100 : palette.purple500};
        background-color: ${isCurrent ? palette.purple400 : 'transparent'};
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

export const CinemaFilter = ({ currentCity }: { currentCity: string }) => {
  const { searchQuery } = useSearch()

  const cityLowerCase = currentCity.toLowerCase()
  const cinemasInCity = cinemas.filter(
    (cinema) => cinema.city.toLowerCase() === cityLowerCase,
  )

  const links = [
    { text: 'All', href: `/city/${cityLowerCase}${searchQuery}` },
    ...cinemasInCity.map((cinema) => ({
      text: cinema.name,
      href: `/city/${cityLowerCase}/cinema/${cinema.slug}${searchQuery}`,
    })),
  ]

  return (
    <Container
      css={css`
        display: flex;
        background-color: ${palette.purple300};
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

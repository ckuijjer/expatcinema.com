import Link from 'next/link'
import { useRouter } from 'next/router'
import React, { useEffect, useState } from 'react'

import { css, cva } from 'styled-system/css'

import cities from '../data/city.json'
import { useSearch } from '../utils/hooks'
import { palette } from '../utils/theme'

const containerStyle = css({
  marginLeft: '-16px',
  marginRight: '-16px',
  paddingLeft: '10px',
  whiteSpace: 'nowrap',
  overflowX: 'auto',
  display: 'flex',
  backgroundColor: 'var(--secondary-color)',
  gap: '12px',
})

const activeLinkVariants = cva({
  base: {
    display: 'inline-block',
    fontSize: '18px',
    padding: '10px',
    marginTop: '8px',
    marginBottom: '8px',
    cursor: 'pointer',
    textDecoration: 'none',
    borderRadius: '4px',
  },
  variants: {
    active: {
      true: {
        color: palette.purple500,
        backgroundColor: 'var(--primary-color)',
      },
      false: {
        color: 'var(--text-inverse-color)',
        backgroundColor: 'transparent',
      },
    },
  },
  defaultVariants: {
    active: false,
  },
})

const ActiveLink = ({
  children,
  href,
  as,
  ...rest
}: {
  children: React.ReactNode
  href: string
  as?: string
  [key: string]: unknown
}) => {
  const { asPath, isReady } = useRouter()
  const [isCurrent, setIsCurrent] = useState(false)

  useEffect(() => {
    if (isReady) {
      const linkPathname = new URL((as || href) as string, location.href)
        .pathname
      const activePathname = new URL(asPath, location.href).pathname
      setIsCurrent(linkPathname === activePathname)
    }
  }, [asPath, isReady, children, as, href, rest])

  return (
    <Link href={href} className={activeLinkVariants({ active: isCurrent })}>
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
    <div className={containerStyle}>
      {links.map(({ text, href }) => (
        <ActiveLink href={href} key={text}>
          {text}
        </ActiveLink>
      ))}
    </div>
  )
}

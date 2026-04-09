'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React from 'react'

import { css } from 'styled-system/css'

import { palette } from '../utils/theme'

const baseLinkStyle = css({
  display: 'inline-block',
  fontSize: '18px',
  padding: '10px',
  marginTop: '8px',
  marginBottom: '8px',
  cursor: 'pointer',
  textDecoration: 'none',
  borderRadius: '4px',
})

export const ActiveLink = React.forwardRef<
  HTMLAnchorElement,
  {
    children: React.ReactNode
    href: string
    activeColor?: string
    activeBackgroundColor?: string
    inactiveColor?: string
    matchPrefix?: boolean
  }
>(
  (
    {
      children,
      href,
      activeColor = palette.purple500,
      activeBackgroundColor = 'var(--primary-color)',
      inactiveColor = 'var(--text-inverse-color)',
      matchPrefix = false,
    },
    ref,
  ) => {
    const pathname = usePathname()
    const linkPathname = new URL(href, 'http://localhost').pathname
    const isCurrent =
      linkPathname === pathname ||
      (matchPrefix &&
        linkPathname !== '/' &&
        pathname.startsWith(linkPathname + '/'))

    return (
      <Link
        ref={ref}
        href={href}
        className={baseLinkStyle}
        style={{
          color: isCurrent ? activeColor : inactiveColor,
          backgroundColor: isCurrent ? activeBackgroundColor : 'transparent',
        }}
      >
        {children}
      </Link>
    )
  },
)
ActiveLink.displayName = 'ActiveLink'

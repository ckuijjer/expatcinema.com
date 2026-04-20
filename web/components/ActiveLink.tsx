'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React from 'react'

import { cva } from 'styled-system/css'

import { palette } from '../utils/theme'

const linkVariants = cva({
  base: {
    '--link-active-background': 'var(--primary-color)',
    '--link-active-color': palette.purple500,
    '--link-inactive-color': 'var(--text-inverse-color)',
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
    tone: {
      light: {
        '--link-active-background': 'var(--primary-color)',
        '--link-active-color': palette.purple500,
        '--link-inactive-color': 'var(--text-inverse-color)',
      },
      dark: {
        '--link-active-background': 'var(--secondary-color)',
        '--link-active-color': 'var(--text-inverse-color)',
        '--link-inactive-color': 'var(--secondary-color)',
      },
    },
    active: {
      true: {
        backgroundColor: 'var(--link-active-background)',
        color: 'var(--link-active-color)',
      },
      false: {
        backgroundColor: 'transparent',
        color: 'var(--link-inactive-color)',
      },
    },
  },
  defaultVariants: {
    active: false,
    tone: 'light',
  },
})

export const ActiveLink = React.forwardRef<
  HTMLAnchorElement,
  {
    children: React.ReactNode
    href: string
    tone?: 'light' | 'dark'
    matchPrefix?: boolean
  }
>(({ children, href, tone = 'light', matchPrefix = false }, ref) => {
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
      className={linkVariants({ active: isCurrent, tone })}
      aria-current={isCurrent ? 'page' : undefined}
    >
      {children}
    </Link>
  )
})
ActiveLink.displayName = 'ActiveLink'

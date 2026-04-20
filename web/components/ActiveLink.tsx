'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React from 'react'

import { cva } from 'styled-system/css'

const linkVariants = cva({
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
    tone: {
      light: {},
      dark: {},
    },
    active: {
      true: {},
      false: {},
    },
  },
  compoundVariants: [
    {
      tone: 'light',
      active: false,
      css: {
        backgroundColor: 'transparent',
        color: 'var(--text-inverse-color)',
      },
    },
    {
      tone: 'light',
      active: true,
      css: {
        backgroundColor: 'var(--primary-color)',
        color: 'var(--palette-purple-500)',
      },
    },
    {
      tone: 'dark',
      active: false,
      css: {
        backgroundColor: 'transparent',
        color: 'var(--palette-purple-500)',
      },
    },
    {
      tone: 'dark',
      active: true,
      css: {
        backgroundColor: 'var(--secondary-color)',
        color: 'var(--text-inverse-color)',
      },
    },
  ],
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
  const isActive =
    linkPathname === pathname ||
    (matchPrefix &&
      linkPathname !== '/' &&
      pathname.startsWith(linkPathname + '/'))

  return (
    <Link
      ref={ref}
      href={href}
      className={linkVariants({ active: isActive, tone })}
      aria-current={isActive ? 'page' : undefined}
    >
      {children}
    </Link>
  )
})
ActiveLink.displayName = 'ActiveLink'

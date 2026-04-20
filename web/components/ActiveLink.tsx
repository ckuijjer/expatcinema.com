'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React from 'react'

import { cva, cx } from 'styled-system/css'

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
      light: {
        color: 'var(--text-inverse-color)',
      },
      dark: {
        color: 'var(--secondary-color)',
      },
    },
  },
  defaultVariants: {
    tone: 'light',
  },
})

const currentLinkVariants = cva({
  base: {
    backgroundColor: 'var(--primary-color)',
  },
  variants: {
    tone: {
      light: {
        color: 'var(--text-color)',
      },
      dark: {
        backgroundColor: 'var(--secondary-color)',
        color: 'var(--text-inverse-color)',
      },
    },
  },
  defaultVariants: {
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
      className={cx(
        linkVariants({ tone }),
        isCurrent ? currentLinkVariants({ tone }) : undefined,
      )}
      aria-current={isCurrent ? 'page' : undefined}
    >
      {children}
    </Link>
  )
})
ActiveLink.displayName = 'ActiveLink'

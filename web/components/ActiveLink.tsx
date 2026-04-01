import { css } from '@emotion/react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import React, { useEffect, useState } from 'react'

import { palette } from '../utils/theme'

export const ActiveLink = ({
  children,
  href,
  activeColor = palette.purple500,
  activeBackgroundColor = 'var(--primary-color)',
  inactiveColor = 'var(--text-inverse-color)',
  matchPrefix = false,
}: {
  children: React.ReactNode
  href: string
  activeColor?: string
  activeBackgroundColor?: string
  inactiveColor?: string
  matchPrefix?: boolean
}) => {
  const { asPath, isReady } = useRouter()
  const [isCurrent, setIsCurrent] = useState(false)

  useEffect(() => {
    if (isReady) {
      // Using URL().pathname to get rid of query and hash
      const linkPathname = new URL(href, location.href).pathname
      const activePathname = new URL(asPath, location.href).pathname

      setIsCurrent(
        linkPathname === activePathname ||
          (matchPrefix &&
            linkPathname !== '/' &&
            activePathname.startsWith(linkPathname + '/')),
      )
    }
  }, [asPath, isReady, href, matchPrefix])

  return (
    <Link
      href={href}
      css={css`
        display: inline-block;
        font-size: 18px;
        color: ${isCurrent ? activeColor : inactiveColor};
        background-color: ${isCurrent ? activeBackgroundColor : 'transparent'};
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

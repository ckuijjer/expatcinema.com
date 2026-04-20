import React from 'react'

import { cva } from 'styled-system/css'

import { palette } from '../utils/theme'

type Color = keyof typeof palette
type ColorValue = (typeof palette)[Color]

export const pageContentStyle = cva({
  base: {
    margin: '0 auto',
    paddingLeft: '16px',
    paddingRight: '16px',
    maxWidth: '960px',
  },
  variants: {
    noPadding: {
      true: {
        paddingLeft: '0',
        paddingRight: '0',
      },
    },
  },
  defaultVariants: {
    noPadding: false,
  },
})

type LayoutProps = {
  backgroundColor?: ColorValue
  noPadding?: boolean
  children: React.ReactNode
}

export const Layout = ({
  backgroundColor,
  noPadding = false,
  children,
}: LayoutProps) => {
  return (
    <div style={{ backgroundColor }}>
      <div className={pageContentStyle({ noPadding })}>{children}</div>
    </div>
  )
}

import React from 'react'

import { cva } from 'styled-system/css'

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
  as?: 'div' | 'main' | 'header'
  backgroundColor?: React.CSSProperties['backgroundColor']
  noPadding?: boolean
  children: React.ReactNode
}

export const Layout = ({
  as: Element = 'div',
  backgroundColor,
  noPadding = false,
  children,
}: LayoutProps) => {
  return (
    <Element
      id={Element === 'main' ? 'main-content' : undefined}
      style={{ backgroundColor }}
    >
      <div className={pageContentStyle({ noPadding })}>{children}</div>
    </Element>
  )
}

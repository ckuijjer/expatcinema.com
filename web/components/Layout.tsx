import React from 'react'

import { css } from 'styled-system/css'

import { palette } from '../utils/theme'

type Color = keyof typeof palette
type ColorValue = (typeof palette)[Color]

export const pageContentStyle = css({
  margin: '0 auto',
  paddingLeft: '16px',
  paddingRight: '16px',
  maxWidth: '960px',
})

type LayoutProps = {
  backgroundColor?: ColorValue
  children: React.ReactNode
}

export const Layout = ({ backgroundColor, children }: LayoutProps) => {
  return (
    <div style={{ backgroundColor }}>
      <div className={pageContentStyle}>{children}</div>
    </div>
  )
}

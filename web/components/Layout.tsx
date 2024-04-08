import { css } from '@emotion/react'
import React from 'react'

import { palette } from '../utils/theme'

type Color = keyof typeof palette // e.g. purple100
type ColorValue = (typeof palette)[Color] // e.g. #f2ebfe

type ContainerProps = {
  backgroundColor?: ColorValue | 'transparent'
  children: React.ReactNode
}

const Container = ({
  backgroundColor = 'transparent',
  children,
}: ContainerProps) => (
  <div
    css={css`
      background-color: ${backgroundColor};
    `}
  >
    {children}
  </div>
)

const Content = (props) => (
  <div
    css={css`
      margin: 0 auto;
      padding-left: 16px;
      padding-right: 16px;
      max-width: 960px;
    `}
    {...props}
  />
)

type LayoutProps = {
  backgroundColor?: ColorValue
  children: React.ReactNode
}

export const Layout = ({ backgroundColor, children }: LayoutProps) => {
  return (
    <Container backgroundColor={backgroundColor}>
      <Content>{children}</Content>
    </Container>
  )
}

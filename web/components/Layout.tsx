import React from 'react'
import { css } from '@emotion/react'
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
    css={css({
      backgroundColor,
    })}
  >
    {children}
  </div>
)

const Content = (props) => (
  <div
    css={css({
      margin: '0 auto',

      paddingLeft: 16,
      paddingRight: 16,
      maxWidth: 960,
    })}
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

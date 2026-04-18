import React from 'react'

import { css, cx } from 'styled-system/css'

import { headerFont } from '../utils/theme'

const headingStyle = css({
  marginTop: '16px',
  marginBottom: '0',
  lineHeight: '1.8',
})

type PageHeadingProps = React.HTMLAttributes<HTMLHeadingElement> & {
  as: 'h1' | 'h2'
}

export const PageHeading = ({ as: Tag, ...props }: PageHeadingProps) => (
  <Tag className={cx(headingStyle, headerFont.className)} {...props} />
)

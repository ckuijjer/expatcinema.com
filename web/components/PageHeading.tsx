import React from 'react'

import { css, cx } from 'styled-system/css'

import { headerFont } from '../utils/theme'

// Headings sit close to what they introduce and far from what came before,
// so that it is clear where one block of information ends and the next begins:
// page title 28px above / 12px below, section 40px above / 12px below
const h1Style = css({
  marginTop: '28px',
  marginBottom: '12px',
  lineHeight: '1.2',
})

const h2Style = css({
  marginTop: '40px',
  marginBottom: '12px',
  lineHeight: '1.3',
})

type PageHeadingProps = React.HTMLAttributes<HTMLHeadingElement> & {
  as: 'h1' | 'h2'
}

export const PageHeading = ({ as: Tag, ...props }: PageHeadingProps) => (
  <Tag
    className={cx(Tag === 'h1' ? h1Style : h2Style, headerFont.className)}
    {...props}
  />
)

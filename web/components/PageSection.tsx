import React from 'react'

import { css, cx } from 'styled-system/css'

import { headerFont } from '../utils/theme'

const titleStyle = css({
  marginTop: '16px',
  marginBottom: '0',
  lineHeight: '1.8',
})

export const PageSection = (
  props: React.HTMLAttributes<HTMLHeadingElement>,
) => <h2 className={cx(titleStyle, headerFont.className)} {...props} />

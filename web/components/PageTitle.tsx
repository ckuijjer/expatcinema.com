import { css } from '@emotion/react'
import React from 'react'

import { headerFont } from '../utils/theme'

export const PageTitle = (props: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h1
    className={headerFont.className}
    css={css`
      margin-top: 16px;
      margin-bottom: 0;
      line-height: 1.8;
    `}
    {...props}
  />
)

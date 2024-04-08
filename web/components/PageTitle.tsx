import { css } from '@emotion/react'

import { headerFont } from '../utils/theme'

export const PageTitle = (props) => (
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

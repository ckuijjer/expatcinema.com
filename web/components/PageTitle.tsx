import { css } from '@emotion/react'
import { headerFont } from '../utils/theme'

export const PageTitle = (props) => (
  <h1
    className={headerFont.className}
    css={css({
      marginTop: 16,
      marginBottom: 0,
      lineHeight: 1.8,
    })}
    {...props}
  />
)

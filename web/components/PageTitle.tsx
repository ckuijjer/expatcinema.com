import { css } from '@emotion/react'
import { headerFont } from '../pages/_app'

export const PageTitle = (props) => (
  <h1
    className={headerFont.className}
    css={css({
      marginTop: 0,
      marginBottom: 0,
      lineHeight: 1.8,
      color: 'var(--text-inverse-color)',
    })}
    {...props}
  />
)

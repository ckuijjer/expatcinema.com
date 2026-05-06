import { cx } from 'styled-system/css'

import { getInitials } from '../utils/getInitials'
import { listPosterPlaceholderStyle } from './listStyles'

export const PosterPlaceholder = ({
  className,
  title,
}: {
  className?: string
  title?: string
}) => (
  <div aria-hidden className={cx(listPosterPlaceholderStyle, className)}>
    {title ? getInitials(title) : null}
  </div>
)

import { cx } from 'styled-system/css'

import { listPosterPlaceholderStyle } from './listStyles'

export const PosterPlaceholder = ({
  className,
}: {
  className?: string
}) => <div aria-hidden className={cx(listPosterPlaceholderStyle, className)} />

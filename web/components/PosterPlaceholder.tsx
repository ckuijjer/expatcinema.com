import { cx } from 'styled-system/css'

import { listPosterPlaceholderStyle } from './listStyles'

const getInitials = (title: string) => {
  const words = title.trim().split(/\s+/)
  if (words.length === 1) return (words[0][0] ?? '').toUpperCase()
  return ((words[0][0] ?? '') + (words[1][0] ?? '')).toUpperCase()
}

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

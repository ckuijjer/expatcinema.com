import { cx } from 'styled-system/css'

import { listPosterPlaceholderStyle } from './listStyles'

const getInitials = (title: string) => {
  // Strip leading punctuation from each token (e.g. "(Novecento)" → "Novecento"),
  // then keep only tokens that start with a letter so digit-prefixed words and bare symbols are skipped.
  const words = title
    .trim()
    .split(/\s+/)
    .map((w) => w.replace(/^[^a-zA-Z0-9]+/, ''))
    .filter((w) => /^[a-zA-Z]/.test(w))
  if (words.length === 0) return ''
  if (words.length === 1) return words[0][0].toUpperCase()
  return (words[0][0] + words[1][0]).toUpperCase()
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

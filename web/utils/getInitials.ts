// Strip leading punctuation from each token (e.g. "(Novecento)" → "Novecento"),
// then keep only tokens that start with a letter so digit-prefixed words and bare symbols are skipped.
export const getInitials = (title: string) => {
  const words = title
    .trim()
    .split(/\s+/)
    .map((w) => w.replace(/^[^a-zA-Z0-9]+/, ''))
    .filter((w) => /^[a-zA-Z]/.test(w))
  if (words.length === 0) return ''
  if (words.length === 1) return words[0][0].toUpperCase()
  return (words[0][0] + words[1][0]).toUpperCase()
}

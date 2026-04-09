export const extractYearFromTitle = (title?: string) => {
  if (!title) {
    return undefined
  }

  const yearMatches = Array.from(
    title.matchAll(/\((?:[^)]*?\b)?((?:19|20)\d{2})(?:\b[^)]*)?\)/g),
  )

  const matchedYear = yearMatches.at(-1)?.[1]

  return matchedYear ? Number(matchedYear) : undefined
}

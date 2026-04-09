export const parseFkFeedYear = (year?: string) => {
  if (!year) {
    return undefined
  }

  const normalizedYear = year.trim()

  if (!/^\d{4}$/.test(normalizedYear)) {
    return undefined
  }

  return Number(normalizedYear)
}

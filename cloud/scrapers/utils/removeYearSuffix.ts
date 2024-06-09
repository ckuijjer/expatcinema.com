export const removeYearSuffix = (title: string) => {
  return title.replace(/\s+\(\d{4}\)$/, '')
}

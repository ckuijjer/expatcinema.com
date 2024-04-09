import { Screening } from '../../types'

export const sortScreenings = (screenings: Screening[]): Screening[] => {
  const compareFns = [
    (a: Screening, b: Screening) =>
      new Date(a.date).getTime() - new Date(b.date).getTime(),
    (a: Screening, b: Screening) => a.cinema.localeCompare(b.cinema),
    (a: Screening, b: Screening) => a.title.localeCompare(b.title),
    (a: Screening, b: Screening) => a.url.localeCompare(b.url),
  ]

  return screenings.toSorted((a: Screening, b: Screening) => {
    for (const compareFn of compareFns) {
      const result = compareFn(a, b)
      if (result !== 0) {
        return result
      }
    }

    return 0
  })
}

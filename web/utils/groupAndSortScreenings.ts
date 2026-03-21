import { DateTime } from 'luxon'

import { Screening } from './getScreenings'
import { getToday } from './getToday'

export type ScreeningWithLuxonDate = Omit<Screening, 'date'> & { date: DateTime }

// sort the screenings by date and time
// group by date
// inject some dates? e.g. the coming week? by doing an intersection with a static list of coming days?
// has to be a string, not a DateTime object, as keys to an Object (e.g. groupedScreenings) have to be a string
export const groupAndSortScreenings = (
  screenings: Screening[],
): Partial<Record<string, ScreeningWithLuxonDate[]>> => {
  const sorted = screenings
    .map((x) => ({ ...x, date: DateTime.fromISO(x.date) })) // use luxon on the date
    .filter((x) => x.date >= getToday())
    .sort((a, b) => a.date.toMillis() - b.date.toMillis())

  // Group by ISO date string (Object.groupBy requires Node 21+)
  return sorted.reduce<Partial<Record<string, ScreeningWithLuxonDate[]>>>(
    (acc, x) => {
      const key = x.date.setZone('Europe/Amsterdam').toISODate() ?? ''
      acc[key] = [...(acc[key] ?? []), x]
      return acc
    },
    {},
  )
}

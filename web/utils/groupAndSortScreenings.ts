import { DateTime } from 'luxon'

import { Screening } from './getScreenings'
import { getToday } from './getToday'

type ScreeningData = Omit<Screening, 'date'> & { date: string }
type ScreeningWithLuxonDate = Omit<Screening, 'date'> & { date: DateTime }

// TODO: The grouping should be based on the Europe/Amsterdam timezone

// sort the screenings by date and time
// group by date
// inject some dates? e.g. the coming week? by doing an intersection with a static list of coming days?
// has to be a string, not a DateTime object, as keys to an Object (e.g. groupedScreenings) have to be a string
export const groupAndSortScreenings = (
  screenings: ScreeningData[],
): Partial<Record<string, ScreeningWithLuxonDate[]>> =>
  Object.groupBy(
    screenings
      .map((x) => ({ ...x, date: DateTime.fromISO(x.date) })) // use luxon on the date
      .filter((x) => x.date >= getToday())
      .sort((a, b) => a.date.toMillis() - b.date.toMillis()),
    (x) => x.date.toISODate() ?? '',
  ) // sort by date ascending

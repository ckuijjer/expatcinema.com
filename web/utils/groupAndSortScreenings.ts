import { groupBy } from 'ramda'
import { DateTime } from 'luxon'

import { getToday } from './getToday'
import { Screening } from './getScreenings'

// TODO: The grouping should be based on the Europe/Amsterdam timezone

// sort the screenings by date and time
// group by date
// inject some dates? e.g. the coming week? by doing an intersection with a static list of coming days?
// has to be a string, not a DateTime object, as keys to an Object (e.g. groupedScreenings) have to be a string
const groupByDate = groupBy((screening) => screening.date.toISODate())

export const groupAndSortScreenings = (
  screenings: ScreeningData[],
): Screenings[] =>
  groupByDate(
    screenings
      .map((x) => ({ ...x, date: DateTime.fromISO(x.date) })) // use luxon on the date
      .filter((x) => x.date >= getToday())
      .sort((a, b) => a.date - b.date),
  ) // sort by date ascending

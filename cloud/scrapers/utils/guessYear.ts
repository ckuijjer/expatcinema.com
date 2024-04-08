import { DateObjectUnits, DateTime } from 'luxon'

// if the date is over half a year in the past, it's likely one belonging to next year
const guessYear = (dateObjects: DateObjectUnits) => {
  const now = DateTime.local()

  let date = DateTime.fromObject(dateObjects)

  // handle edge case where you're looking for 29 feb in a leap year that's next year
  if (!date.isValid && date.invalidReason === 'unit out of range') {
    date = DateTime.fromObject({ ...dateObjects, year: now.year + 1 })
  }

  if (date < now.minus({ months: 6 })) {
    return date.year + 1
  } else {
    return date.year
  }
}

export default guessYear

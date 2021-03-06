const { DateTime } = require('luxon')

// if the date is over half a year in the past, it's likely one belonging to next year
const guessYear = (date) => {
  const now = DateTime.local()
  if (date < now.minus({ months: 6 })) {
    return date.year + 1
  } else {
    return date.year
  }
}

module.exports = guessYear

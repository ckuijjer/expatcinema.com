import { groupBy } from 'ramda'
import { screenings, cinemas } from './data'
import { DateTime } from 'luxon'
import getToday from './getToday'

// TODO: The grouping should be based on the Europe/Amsterdam timezone

// sort the screenings by date and time
// group by date
// inject some dates? e.g. the coming week? by doing an intersection with a static list of coming days?
// has to be a string, not a DateTime object, as keys to an Object (e.g. groupedScreenings) have to be a string
const groupByDate = groupBy(screening => screening.date.toISODate())

const groupedScreenings = groupByDate(
  screenings
    .map(x => ({ ...x, date: DateTime.fromISO(x.date) })) // use luxon on the date
    .map(x => ({ ...x, cinema: cinemas.filter(y => y.name === x.cinema)[0] })) // nasty trick of adding the cinema as a subtree
    .filter(x => x.date >= getToday())
    .sort((a, b) => a.date - b.date),
) // sort by date ascending

// Add the days in the next week that don't have a screening
// TODO: this should be render logic
// Array(7)
//   .fill()
//   .map((x, i) =>
//     getToday()
//       .plus({ days: i })
//       .toISODate(),
//   )
//   .forEach(date => {
//     if (!groupedScreenings[date]) {
//       groupedScreenings[date] = []
//     }
//   })

export default groupedScreenings

import { groupBy } from 'ramda'
import { cinemas } from './data'
import { DateTime } from 'luxon'
import axios from 'axios'

import getToday from './getToday'

// TODO: The grouping should be based on the Europe/Amsterdam timezone

// sort the screenings by date and time
// group by date
// inject some dates? e.g. the coming week? by doing an intersection with a static list of coming days?
// has to be a string, not a DateTime object, as keys to an Object (e.g. groupedScreenings) have to be a string
const groupByDate = groupBy(screening => screening.date.toISODate())

const getScreenings = () =>
  axios
    .get(
      'https://s3-eu-west-1.amazonaws.com/expatcinema-public/screenings.json',
    )
    .then(
      ({ data }) =>
        groupByDate(
          data
            .map(x => ({ ...x, date: DateTime.fromISO(x.date) })) // use luxon on the date
            .map(x => ({
              ...x,
              cinema: cinemas.filter(y => y.name === x.cinema)[0],
            })) // nasty trick of adding the cinema as a subtree
            .filter(x => x.date >= getToday())
            .sort((a, b) => a.date - b.date),
        ), // sort by date ascending
    )

export default getScreenings

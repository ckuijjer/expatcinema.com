// filters is a list of exclusion patterns, if one of the filters applies to a movie, remove it
const filters = [
  x =>
    x.title === 'Sprekend Nederland' &&
    x.cinema === 'Eye' &&
    x.date !== '2018-10-13T16:15:00.000Z',
]

const applyFilters = results =>
  results.filter(result => filters.every(filter => !filter(result)))

if (require.main === module) {
  const all = require('./output/2018-10-09T15:45:14.112Z_all.json')
  const filtered = applyFilters(all)

  console.log({ all: all.length, filtered: filtered.length })
}

module.exports = applyFilters

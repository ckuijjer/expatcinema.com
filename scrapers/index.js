const { DateTime } = require('luxon')
const R = require('ramda')
const fs = require('fs')

const debug = require('debug')('combined scraper')

const applyFilters = require('./filters')

const debugPromise = (format, ...debugArgs) => arg => {
  debug(format, ...debugArgs, arg)
  return arg
}

const sort = R.sortWith([
  (a, b) => DateTime.fromISO(a.date) - DateTime.fromISO(b.date),
  R.ascend(R.prop('cinema')),
  R.ascend(R.prop('title')),
  R.ascend(R.prop('url')),
])

const flatten = (acc, cur) => [...acc, ...cur]

const now = DateTime.fromObject({})
  .toUTC()
  .toISO()

const writeToFileAndContinue = filename => data => {
  fs.writeFileSync(filename, JSON.stringify(data, null, 2))
  return data
}

Promise.all(
  [
    'bioscopenleiden',
    'eyefilm',
    'filmhuisdenhaag',
    'kinorotterdam',
    'kriterion',
    'lab111',
    'lantarenvenster',
    'springhaver',
    'hartlooper',
    'liff',
  ].map(name => {
    const fn = require(`./${name}`)
    return fn()
      .then(sort)
      .then(writeToFileAndContinue(`output/${now}_${name}.json`))
  }),
)
  .then(results => sort(results.reduce(flatten, [])))
  .then(writeToFileAndContinue(`output/${now}_all.json`))
  .then(applyFilters)
  .then(writeToFileAndContinue(`output/${now}_all_filtered.json`))

const { DateTime } = require('luxon')
const R = require('ramda')
const AWS = require('aws-sdk')

const s3 = new AWS.S3()

const PRIVATE_BUCKET = 'expatcinema-scrapers-output'
const PUBLIC_BUCKET = 'expatcinema-public'

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

const writeToFileInBucketAndContinue = bucket => filename => data =>
  new Promise((resolve, reject) => {
    const params = {
      Bucket: bucket,
      Key: filename,
      Body: JSON.stringify(data, null, 2),
    }
    s3.putObject(params, err => {
      if (err) return reject(err)
      return resolve(data)
    })
  })

const writeToFileAndContinue = writeToFileInBucketAndContinue(PRIVATE_BUCKET)
const writeToPublicFileAndContinue = writeToFileInBucketAndContinue(
  PUBLIC_BUCKET,
)

exports.scrapers = () =>
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
      // 'liff',
    ].map(name => {
      const fn = require(`./${name}`)
      return fn()
        .then(sort)
        .then(writeToFileAndContinue(`${name}/${now}.json`))
    }),
  )
    .then(results => sort(results.reduce(flatten, [])))
    .then(writeToFileAndContinue(`all/${now}.json`))
    .then(applyFilters)
    .then(writeToFileAndContinue(`filtered/${now}.json`))
    .then(writeToPublicFileAndContinue('screenings.json'))

const { DateTime, Settings } = require('luxon')
const R = require('ramda')
const AWS = require('aws-sdk')
const documentClient = require('../documentClient')

// Set the default timezone to Europe/Amsterdam, otherwise AWS Lambda will scrape as UTC and running it locally
// as Europe/Amsterdam
Settings.defaultZone = 'Europe/Amsterdam'

const s3 = new AWS.S3()

const PRIVATE_BUCKET = 'expatcinema-scrapers-output'
const PUBLIC_BUCKET = 'expatcinema-public'

const debug = require('debug')('combined scraper')

const applyFilters = require('./filters')

const debugPromise =
  (format, ...debugArgs) =>
  (arg) => {
    debug(format, ...debugArgs, arg)
    return arg
  }

const sort = R.sortWith([
  (a, b) => DateTime.fromISO(a.date) - DateTime.fromISO(b.date),
  R.ascend(R.prop('cinema')),
  R.ascend(R.prop('title')),
  R.ascend(R.prop('url')),
])

const now = DateTime.fromObject({}).toUTC().toISO()

const writeToFileInBucket = (bucket) => (filename) => async (data) => {
  const params = {
    Bucket: bucket,
    Key: filename,
    Body: JSON.stringify(data, null, 2),
  }
  return await s3.putObject(params).promise()
}

const writeToFile = writeToFileInBucket(PRIVATE_BUCKET)
const writeToPublicFile = writeToFileInBucket(PUBLIC_BUCKET)

const writeToAnalytics = (type) => async (fields) => {
  const params = {
    TableName: process.env.DYNAMODB_ANALYTICS,
    Item: {
      type,
      createdAt: now,
      ...fields,
    },
  }
  return await documentClient.put(params).promise()
}

exports.scrapers = async () => {
  const SCRAPERS = [
    'bioscopenleiden',
    'eyefilm',
    'filmhuisdenhaag',
    'kinorotterdam',
    'kriterion',
    'lab111',
    'lantarenvenster',
    'springhaver',
    'hartlooper',
    'rialto',
    'cinecenter',
    // 'liff',
    'filmhuislumen',
    'forumgroningen',
    // 'ketelhuis',
  ]

  const results = Object.fromEntries(
    await Promise.all(
      SCRAPERS.map(async (name) => {
        const fn = require(`./${name}`)
        return [name, sort(await fn())]
      }),
    ),
  )

  results.all = sort(Object.values(results).flat())
  results.filtered = applyFilters(results.all)

  // write all to S3
  await Promise.all(
    Object.entries(results).map(
      async ([name, data]) => await writeToFile(`${name}/${now}.json`)(data),
    ),
  )
  await writeToPublicFile('screenings.json')(results.filtered)

  const countPerScraper = Object.fromEntries(
    Object.entries(results).map(([name, data]) => [name, data.length]),
  )
  await writeToAnalytics('count')(countPerScraper)
}

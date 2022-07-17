const { DateTime, Settings } = require('luxon')
const R = require('ramda')
const AWS = require('aws-sdk')
const documentClient = require('../documentClient')
const { writeFile, mkdir } = require('fs/promises')
const { dirname } = require('path')

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
  const dataJson = JSON.stringify(data, null, 2)

  if (process.env.IS_LOCAL) {
    // serverless invoke local
    const path = `./output/${bucket}/${filename}`
    await mkdir(dirname(path), { recursive: true })
    return writeFile(path, dataJson)
  } else {
    const params = {
      Bucket: bucket,
      Key: filename,
      Body: dataJson,
    }
    return s3.putObject(params).promise()
  }
}

const writeToFile = writeToFileInBucket(PRIVATE_BUCKET)
const writeToPublicFile = writeToFileInBucket(PUBLIC_BUCKET)

const writeToAnalytics = (type) => async (fields) => {
  if (process.env.IS_LOCAL) {
    // serverless invoke local
    const path = `./output/analytics/${type}.json`
    await mkdir(dirname(path), { recursive: true })
    return writeFile(path, JSON.stringify(fields, null, 2))
  } else {
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
}

exports.scrapers = async () => {
  const SCRAPERS = process.env.SCRAPERS
    ? process.env.SCRAPERS.split(',')
    : [
        'bioscopenleiden',
        'eyefilm',
        'filmhuisdenhaag',
        'kinorotterdam',
        'kriterion',
        'lab111',
        'lantarenvenster',
        'springhaver',
        'hartlooper',
        // 'rialto',
        'cinecenter',
        // 'liff',
        'filmhuislumen',
        'forumgroningen',
        // 'ketelhuis',
      ]

  debug('start scraping %O', SCRAPERS)
  const results = Object.fromEntries(
    await Promise.all(
      SCRAPERS.map(async (name) => {
        const fn = require(`./${name}`)
        return [name, sort(await fn())]
      }),
    ),
  )
  debug('done scraping')

  results.all = sort(Object.values(results).flat())
  results.filtered = applyFilters(results.all)

  debug('writing all to private S3 bucket')
  await Promise.all(
    Object.entries(results).map(
      async ([name, data]) => await writeToFile(`${name}/${now}.json`)(data),
    ),
  )

  debug('writing filtered to public S3 bucket')
  await writeToPublicFile('screenings.json')(results.filtered)

  const countPerScraper = Object.fromEntries(
    Object.entries(results).map(([name, data]) => [name, data.length]),
  )

  debug('writing to analytics json %O', countPerScraper)
  await writeToAnalytics('count')(countPerScraper)
}

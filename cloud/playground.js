const { DateTime, Info, Settings } = require('luxon')
const { inspect } = require('util')

const documentClient = require('./documentClient')

Settings.defaultZone = 'Europe/Amsterdam'

const timezonePlayground = async ({ event, context } = {}) => {
  const timestamp = '2019-01-09 11:23'
  const format = 'yyyy-MM-dd HH:mm'

  const amsterdamFromFormatWithZone = DateTime.fromFormat(timestamp, format, {
    zone: 'Europe/Amsterdam',
  })
    .toUTC()
    .toISO()

  const utcTime = DateTime.fromFormat(timestamp, format).toUTC().toISO()

  const utcTimeWithZone = DateTime.fromFormat(timestamp, format, {
    zone: 'UTC',
  })
    .toUTC()
    .toISO()

  const result = {
    // features,
    amsterdamFromFormatWithZone,
    utcTime,
    utcTimeWithZone,
  }

  console.log(result)
  return result
}

const playground = async ({ event, context } = {}) => {
  const record1 = {
    scraper: 'new Date',
    createdAt: new Date().toISOString(),
    count: 1,
  }

  const record2 = {
    scraper: 'luxon',
    createdAt: DateTime.fromObject({}).toUTC().toISO(),
    count: 2,
  }

  // const result1 = await documentClient
  //   .put({
  //     TableName: process.env.DYNAMODB_ANALYTICS,
  //     Item: record1,
  //   })
  //   .promise()

  // const result2 = await documentClient
  //   .put({
  //     TableName: process.env.DYNAMODB_ANALYTICS,
  //     Item: record2,
  //   })
  //   .promise()

  const result = await documentClient
    .scan({
      TableName: process.env.DYNAMODB_ANALYTICS,
    })
    .promise()

  const scraper = 'all'
  const createdAt = '2021-07-17T15:34'

  const queryResult = await documentClient
    .query({
      TableName: process.env.DYNAMODB_ANALYTICS,
      KeyConditionExpression: 'scraper = :scraper and createdAt >= :createdAt',
      ExpressionAttributeValues: {
        ':scraper': scraper,
        ':createdAt': createdAt,
      },
    })
    .promise()

  const out = { result, queryResult }
  console.log(inspect(out, false, null, true))
  return out
}

if (require.main === module) {
  // console.log(playground({}))
  playground()
}

exports.playground = playground

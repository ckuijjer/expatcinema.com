const { DateTime, Info, Settings } = require('luxon')
const AWS = require('aws-sdk')

const documentClient = new AWS.DynamoDB.DocumentClient({
  convertEmptyValues: true,
})

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
    createdAt: new Date(),
    count: 1,
  }

  const record2 = {
    scraper: 'luxon',
    createdAt: DateTime.fromObject({}).toUTC().toISO(),
    count: 2,
  }

  const result1 = await documentClient
    .put({
      TableName: process.env.DYNAMODB_ANALYTICS,
      Item: record1,
    })
    .promise()

  const result2 = await documentClient
    .put({
      TableName: process.env.DYNAMODB_ANALYTICS,
      Item: record2,
    })
    .promise()

  console.log({ result1, result2 })

  const result = await documentClient
    .scan({
      TableName: process.env.DYNAMODB_ANALYTICS,
    })
    .promise()

  console.log({ result })

  return { result1, result2, result }
}

if (require.main === module) {
  // console.log(playground({}))
  playground()
}

exports.playground = playground

const { DateTime, Settings } = require('luxon')
const documentClient = require('./documentClient')

Settings.defaultZone = 'Europe/Amsterdam'

const analytics = async ({ event, context } = {}) => {
  const fourWeeksAgo = DateTime.now().minus({ weeks: 4 }).startOf('day').toISO()

  const data = await documentClient
    .query({
      TableName: process.env.DYNAMODB_ANALYTICS,
      KeyConditionExpression: '#type = :type and createdAt >= :createdAt',
      ExpressionAttributeNames: {
        '#type': 'type',
      },
      ExpressionAttributeValues: {
        ':type': 'count',
        ':createdAt': fourWeeksAgo,
      },
    })
    .promise()

  // convert to data points of the type createdAt, count, and scraper
  const dataPoints = data.Items.flatMap(({ createdAt, ...rest }) =>
    Object.entries(rest).map(([scraper, count]) => ({
      type: 'count',
      createdAt,
      scraper,
      value: count,
    })),
  )

  return {
    statusCode: 200,
    body: JSON.stringify(dataPoints, null, 2),
  }
}

exports.analytics = analytics
